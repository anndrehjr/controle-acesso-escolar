import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import dotenv from "dotenv";
import postgres from "postgres";
import { ALL_CLASSROOMS } from "../src/lib/school-data";
import { ALL_CLASSROOMS_B2 } from "../src/lib/school-data-b2";
import {
  expectedConfirmation, getPedagogicalGroup, getSchoolYear, normalizeText,
  parseImportOptions, validateDataset, type ImportClassRoom, type ImportOptions,
  type ValidatedDataset,
} from "./import-school-data-lib";

dotenv.config({ path: ".env.local" });

type DbClass = { id: string; nome: string; etapa: "EF" | "EM"; ano_serie: number; periodo: string; total_ativos: number; grupo_pedagogico: string; ativo: boolean };
type DbStudent = { id: string; turma_id: string; numero_chamada: number; nome: string; status: string; em_atencao: boolean; ativo: boolean };
type DbDiscipline = { id: string; codigo: string; nome: string };
type DbMatrix = { etapa: string; codigo: string; disciplina_id: string; disciplina_nome: string; ativo: boolean };
type DbGrade = { aluno_id: string; disciplina_id: string; nota: string | number; status: string; turma_id: string };
type Snapshot = { schoolName: string; classes: DbClass[]; students: DbStudent[]; disciplines: DbDiscipline[]; matrix: DbMatrix[]; grades: DbGrade[] };
type Counters = { create: number; update: number; unchanged: number };
type Plan = { classes: Counters; students: Counters; disciplines: { create: number; reuse: number }; matrix: Counters; grades: Counters; deletes: 0 };
type Report = {
  batchId: string; mode: "dry-run" | "apply"; generatedAt: string;
  school: { id: string; name: string }; source: string; year: number; term: number;
  zeroPolicy: string; sourceSummary: ValidatedDataset["summary"]; warnings: string[];
  plan: Plan; backupReference?: string; operator?: string;
};

const pickSource = (source: ImportOptions["source"]): ImportClassRoom[] => source === "b1" ? ALL_CLASSROOMS : ALL_CLASSROOMS_B2;
const sameText = (a: string, b: string) => normalizeText(a) === normalizeText(b);
const newCode = (name: string) => `IMP_${normalizeText(name).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")}`.slice(0, 32);

async function loadSnapshot(sql: ReturnType<typeof postgres>, options: ImportOptions): Promise<Snapshot> {
  const schools = await sql<{ id: string; nome: string }[]>`SELECT id, nome FROM public.escolas WHERE id=${options.schoolId} LIMIT 1`;
  if (schools.length !== 1) throw new Error(`Escola não encontrada: ${options.schoolId}`);
  const [classes, students, disciplines, matrix, grades] = await Promise.all([
    sql<DbClass[]>`SELECT id,nome,etapa,ano_serie,periodo,total_ativos,grupo_pedagogico,ativo FROM public.turmas WHERE escola_id=${options.schoolId}`,
    sql<DbStudent[]>`SELECT id,turma_id,numero_chamada,nome,status,em_atencao,ativo FROM public.alunos WHERE escola_id=${options.schoolId}`,
    sql<DbDiscipline[]>`SELECT id,codigo,nome FROM public.disciplinas WHERE escola_id=${options.schoolId}`,
    sql<DbMatrix[]>`SELECT md.etapa,md.codigo,md.disciplina_id,d.nome AS disciplina_nome,md.ativo FROM public.matriz_disciplinas md JOIN public.disciplinas d ON d.id=md.disciplina_id WHERE md.escola_id=${options.schoolId}`,
    sql<DbGrade[]>`SELECT aluno_id,disciplina_id,nota,status,turma_id FROM public.notas WHERE escola_id=${options.schoolId} AND ano_letivo=${options.year} AND bimestre=${options.term}`,
  ]);
  return { schoolName: schools[0].nome, classes, students, disciplines, matrix, grades };
}

function resolveDisciplines(dataset: ValidatedDataset, snapshot: Snapshot) {
  const matrixRows = new Map(snapshot.matrix.map((row) => [`${row.etapa}:${row.codigo}`, row]));
  const byName = new Map<string, DbDiscipline[]>();
  for (const row of snapshot.disciplines) {
    const key = normalizeText(row.nome);
    byName.set(key, [...(byName.get(key) ?? []), row]);
  }
  const resolved = new Map<string, { disciplineId?: string; subjectName: string; normalizedName: string }>();
  const newNames = new Set<string>();
  for (const item of dataset.matrix) {
    const key = `${item.group}:${item.code}`;
    const matrixRow = matrixRows.get(key);
    if (matrixRow) {
      if (!sameText(matrixRow.disciplina_nome, item.subjectName)) throw new Error(`${key}: banco="${matrixRow.disciplina_nome}"; fonte="${item.subjectName}"`);
      resolved.set(key, { disciplineId: matrixRow.disciplina_id, subjectName: item.subjectName, normalizedName: item.normalizedName });
      continue;
    }
    const candidates = byName.get(item.normalizedName) ?? [];
    if (candidates.length > 1) throw new Error(`${key}: existem ${candidates.length} disciplinas chamadas "${item.subjectName}" sem matriz para resolver a ambiguidade`);
    resolved.set(key, { disciplineId: candidates[0]?.id, subjectName: item.subjectName, normalizedName: item.normalizedName });
    if (candidates.length === 0) newNames.add(item.normalizedName);
  }
  return { resolved, newNames };
}

function createPlan(dataset: ValidatedDataset, snapshot: Snapshot): Plan {
  const plan: Plan = {
    classes: { create: 0, update: 0, unchanged: 0 }, students: { create: 0, update: 0, unchanged: 0 },
    disciplines: { create: 0, reuse: 0 }, matrix: { create: 0, update: 0, unchanged: 0 },
    grades: { create: 0, update: 0, unchanged: 0 }, deletes: 0,
  };
  const { resolved, newNames } = resolveDisciplines(dataset, snapshot);
  plan.disciplines.create = newNames.size;
  plan.disciplines.reuse = new Set([...resolved.values()].flatMap((item) => item.disciplineId ? [item.disciplineId] : [])).size;
  const classes = new Map(snapshot.classes.map((row) => [row.nome, row]));
  const normalizedClasses = new Map(snapshot.classes.map((row) => [normalizeText(row.nome), row.nome]));
  const students = new Map(snapshot.students.map((row) => [`${row.turma_id}:${row.numero_chamada}`, row]));
  const matrix = new Map(snapshot.matrix.map((row) => [`${row.etapa}:${row.codigo}`, row]));
  const grades = new Map(snapshot.grades.map((row) => [`${row.aluno_id}:${row.disciplina_id}`, row]));

  for (const classroom of dataset.classes) {
    const dbClass = classes.get(classroom.name);
    const normalizedMatch = normalizedClasses.get(normalizeText(classroom.name));
    if (!dbClass && normalizedMatch) throw new Error(`A turma "${classroom.name}" coincide com "${normalizedMatch}" após normalização`);
    const group = getPedagogicalGroup(classroom);
    const changed = dbClass && (dbClass.etapa !== classroom.level || dbClass.ano_serie !== getSchoolYear(classroom.name) || dbClass.periodo !== "Manhã" || dbClass.total_ativos !== classroom.totalActive || dbClass.grupo_pedagogico !== group || !dbClass.ativo);
    if (!dbClass) plan.classes.create++; else if (changed) plan.classes.update++; else plan.classes.unchanged++;
    for (const student of classroom.students) {
      const transferred = Object.values(student.grades).every((grade) => grade === "TR");
      const dbStudent = dbClass ? students.get(`${dbClass.id}:${student.id}`) : undefined;
      const changedStudent = dbStudent && (dbStudent.nome !== student.name || dbStudent.status !== (transferred ? "TRANSFERIDO" : "ATIVO") || dbStudent.em_atencao !== student.isAttention || dbStudent.ativo !== !transferred);
      if (!dbStudent) plan.students.create++; else if (changedStudent) plan.students.update++; else plan.students.unchanged++;
      if (transferred) continue;
      for (const [code, value] of Object.entries(student.grades)) {
        if (typeof value !== "number") continue;
        const disciplineId = resolved.get(`${group}:${code.toUpperCase()}`)?.disciplineId;
        const dbGrade = dbStudent && disciplineId ? grades.get(`${dbStudent.id}:${disciplineId}`) : undefined;
        if (!dbGrade) plan.grades.create++;
        else if (Number(dbGrade.nota) !== value || dbGrade.status !== "NORMAL" || dbGrade.turma_id !== dbClass?.id) plan.grades.update++;
        else plan.grades.unchanged++;
      }
    }
  }
  for (const item of dataset.matrix) {
    const key = `${item.group}:${item.code}`;
    const current = matrix.get(key);
    const target = resolved.get(key);
    if (!current) plan.matrix.create++;
    else if (!current.ativo || current.disciplina_id !== target?.disciplineId) plan.matrix.update++;
    else plan.matrix.unchanged++;
  }
  return plan;
}

async function applyDataset(sql: ReturnType<typeof postgres>, options: ImportOptions, dataset: ValidatedDataset, snapshot: Snapshot, report: Report) {
  const initial = resolveDisciplines(dataset, snapshot);
  await sql.begin(async (tx) => {
    const idsByName = new Map<string, string>();
    for (const item of initial.resolved.values()) if (item.disciplineId) idsByName.set(item.normalizedName, item.disciplineId);
    for (const normalizedName of initial.newNames) {
      const item = [...initial.resolved.values()].find((row) => row.normalizedName === normalizedName)!;
      const rows = await tx<{ id: string }[]>`INSERT INTO public.disciplinas (escola_id,codigo,nome,ativo,etapa) VALUES (${options.schoolId},${newCode(item.subjectName)},${item.subjectName},true,'AMBOS') RETURNING id`;
      idsByName.set(normalizedName, rows[0].id);
    }
    const matrixIds = new Map<string, string>();
    for (const item of dataset.matrix) {
      const key = `${item.group}:${item.code}`;
      const found = initial.resolved.get(key)!;
      const disciplineId = found.disciplineId ?? idsByName.get(item.normalizedName);
      if (!disciplineId) throw new Error(`Disciplina não resolvida para ${key}`);
      await tx`INSERT INTO public.matriz_disciplinas (escola_id,etapa,codigo,disciplina_id,ativo) VALUES (${options.schoolId},${item.group},${item.code},${disciplineId},true) ON CONFLICT (escola_id,etapa,codigo) DO UPDATE SET disciplina_id=EXCLUDED.disciplina_id,ativo=true`;
      matrixIds.set(key, disciplineId);
    }
    for (const classroom of dataset.classes) {
      const group = getPedagogicalGroup(classroom);
      const classRows = await tx<{ id: string }[]>`INSERT INTO public.turmas (escola_id,nome,etapa,ano_serie,periodo,total_ativos,grupo_pedagogico,ativo) VALUES (${options.schoolId},${classroom.name},${classroom.level},${getSchoolYear(classroom.name)},'Manhã',${classroom.totalActive},${group},true) ON CONFLICT (escola_id,nome) DO UPDATE SET etapa=EXCLUDED.etapa,ano_serie=EXCLUDED.ano_serie,periodo=EXCLUDED.periodo,total_ativos=EXCLUDED.total_ativos,grupo_pedagogico=EXCLUDED.grupo_pedagogico,ativo=true RETURNING id`;
      const classId = classRows[0].id;
      for (const student of classroom.students) {
        const transferred = Object.values(student.grades).every((grade) => grade === "TR");
        const studentRows = await tx<{ id: string }[]>`INSERT INTO public.alunos (escola_id,turma_id,nome,numero_chamada,status,em_atencao,ativo) VALUES (${options.schoolId},${classId},${student.name},${student.id},${transferred ? "TRANSFERIDO" : "ATIVO"},${student.isAttention},${!transferred}) ON CONFLICT (turma_id,numero_chamada) DO UPDATE SET escola_id=EXCLUDED.escola_id,nome=EXCLUDED.nome,status=EXCLUDED.status,em_atencao=EXCLUDED.em_atencao,ativo=EXCLUDED.ativo RETURNING id`;
        const enrollmentRows = await tx<{ id: string }[]>`INSERT INTO public.matriculas (escola_id,aluno_id,turma_id,ano_letivo,numero_chamada,status,data_inicio) VALUES (${options.schoolId},${studentRows[0].id},${classId},${options.year},${student.id},${transferred ? "TRANSFERIDA" : "ATIVA"},make_date(${options.year},1,1)) ON CONFLICT (aluno_id,turma_id,ano_letivo) DO UPDATE SET numero_chamada=EXCLUDED.numero_chamada,status=EXCLUDED.status,updated_at=now() RETURNING id`;
        if (transferred) continue;
        for (const [code, value] of Object.entries(student.grades)) {
          if (typeof value !== "number") continue;
          const disciplineId = matrixIds.get(`${group}:${code.toUpperCase()}`);
          if (!disciplineId) throw new Error(`Matriz não resolvida para ${group}:${code}`);
          await tx`INSERT INTO public.notas (escola_id,turma_id,aluno_id,matricula_id,disciplina_id,ano_letivo,bimestre,nota,status,origem_calculo) VALUES (${options.schoolId},${classId},${studentRows[0].id},${enrollmentRows[0].id},${disciplineId},${options.year},${options.term},${value},'NORMAL','LANCAMENTO_MANUAL') ON CONFLICT (aluno_id,disciplina_id,bimestre,ano_letivo) DO UPDATE SET escola_id=EXCLUDED.escola_id,turma_id=EXCLUDED.turma_id,matricula_id=EXCLUDED.matricula_id,nota=EXCLUDED.nota,status=EXCLUDED.status,origem_calculo=EXCLUDED.origem_calculo,updated_at=now()`;
        }
      }
    }
    await tx`INSERT INTO public.logs_acesso (usuario_email,role,escola_id,acao,tela,dados_novos,sucesso) VALUES (${options.operator!},'SISTEMA',${options.schoolId},'IMPORTACAO_DADOS','scripts/import-school-data',${JSON.stringify(report)}::jsonb,true)`;
  });
}

async function saveReport(path: string | undefined, report: Report) {
  if (!path) return;
  const fullPath = resolve(path);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Relatório gravado em ${fullPath}`);
}

async function main() {
  const options = parseImportOptions(process.argv.slice(2));
  const dataset = validateDataset(pickSource(options.source), options.zeroPolicy);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
  const sql = postgres(process.env.DATABASE_URL, { max: 5, prepare: false });
  const batchId = randomUUID();
  try {
    const snapshot = await loadSnapshot(sql, options);
    const report: Report = {
      batchId, mode: options.apply ? "apply" : "dry-run", generatedAt: new Date().toISOString(),
      school: { id: options.schoolId, name: snapshot.schoolName }, source: options.source,
      year: options.year, term: options.term, zeroPolicy: options.zeroPolicy,
      sourceSummary: dataset.summary, warnings: dataset.warnings,
      plan: createPlan(dataset, snapshot), backupReference: options.backupReference, operator: options.operator,
    };
    console.log(JSON.stringify(report, null, 2));
    await saveReport(options.reportPath, report);
    if (!options.apply) {
      console.log(`SIMULAÇÃO concluída. Nenhuma linha foi alterada. Para aplicar: --apply --confirm=${expectedConfirmation(options)}`);
      return;
    }
    await applyDataset(sql, options, dataset, snapshot, report);
    console.log(`Importação ${batchId} aplicada em uma transação e registrada em logs_acesso.`);
  } catch (error) {
    if (options.apply) {
      try {
        await sql`INSERT INTO public.logs_acesso (usuario_email,role,escola_id,acao,tela,dados_novos,sucesso) VALUES (${options.operator ?? "desconhecido"},'SISTEMA',${options.schoolId},'IMPORTACAO_DADOS','scripts/import-school-data',${JSON.stringify({ batchId, error: error instanceof Error ? error.message : String(error) })}::jsonb,false)`;
      } catch { /* O erro original é preservado. */ }
    }
    throw error;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

