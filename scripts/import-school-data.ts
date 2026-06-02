import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

// ╔══════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO — altere aqui antes de cada importação ║
// ╠══════════════════════════════════════════════════════╣
// ║  BIMESTRE 1 → import { ALL_CLASSROOMS }              ║
// ║              from "../src/lib/school-data"           ║
// ║  BIMESTRE 2 → import { ALL_CLASSROOMS_B2 as ALL_CLASSROOMS } ║
// ║              from "../src/lib/school-data-b2"        ║
// ╚══════════════════════════════════════════════════════╝

//import { ALL_CLASSROOMS } from "../src/lib/school-data";
 import { ALL_CLASSROOMS_B2 as ALL_CLASSROOMS } from "../src/lib/school-data-b2";

const ESCOLA_ID = "6b50af3f-8023-497f-bccb-32ceec3d0252";
const ANO_LETIVO = 2026;
const BIMESTRE = 2;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

type NotaInsert = {
  escola_id: string;
  turma_id: string;
  aluno_id: string;
  disciplina_id: string;
  ano_letivo: number;
  bimestre: number;
  nota: number;
  status: string;
};

function normalizarTexto(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executarComRetry<T extends { error?: unknown }>(
  operacao: () => PromiseLike<T>,
  descricao: string,
  tentativas = 5
): Promise<T> {
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      const resultado = await Promise.resolve(operacao());

      if (!resultado.error) {
        return resultado;
      }

      const mensagem = JSON.stringify(resultado.error);

      if (mensagem.includes("fetch failed") || mensagem.includes("ECONNRESET")) {
        console.log(`⚠️  Retry ${tentativa}/${tentativas} -> ${descricao}`);
        await sleep(1000 * tentativa);
        continue;
      }

      return resultado;
    } catch {
      console.log(`⚠️  Erro inesperado em ${descricao} (tentativa ${tentativa})`);
      await sleep(1000 * tentativa);
    }
  }

  throw new Error(`Falha total: ${descricao}`);
}

function getAnoSerie(nomeTurma: string) {
  if (nomeTurma.includes("1ª")) return 1;
  if (nomeTurma.includes("2ª")) return 2;
  if (nomeTurma.includes("3ª")) return 3;
  return Number(nomeTurma.replace(/\D/g, ""));
}

function getGrupoPedagogico(turma: { name: string; level: "EF" | "EM" }) {
  const anoSerie = getAnoSerie(turma.name);

  if (turma.level === "EF" && [6, 9].includes(anoSerie)) return "FUND_69";
  if (turma.level === "EF" && [7, 8].includes(anoSerie)) return "FUND_78";
  if (turma.level === "EM" && [1, 2].includes(anoSerie)) return "MEDIO_12";
  if (turma.level === "EM" && anoSerie === 3) return "MEDIO_3";

  return "INDEFINIDO";
}

async function importar() {
  console.log("🚀 Iniciando importação completa\n");

  // ── 1. Limpar notas e matriz_disciplinas existentes ──────────────────────
  console.log("🧹 Limpando notas e matriz_disciplinas...");

  await executarComRetry(
    () =>
      supabase
        .from("notas")
        .delete()
        .eq("escola_id", ESCOLA_ID)
        .eq("bimestre", BIMESTRE),
    `limpar notas do ${BIMESTRE}º bimestre`
  );
  await executarComRetry(
    () => supabase.from("matriz_disciplinas").delete().eq("escola_id", ESCOLA_ID),
    "limpar matriz_disciplinas"
  );

  console.log("✅ Limpeza concluída\n");

  // ── 2. Carregar disciplinas existentes no banco ───────────────────────────
  const disciplinasMap = new Map<string, string>(); // normalized_name → id

  const { data: disciplinasBanco } = await executarComRetry(
    () => supabase.from("disciplinas").select("id, nome").eq("escola_id", ESCOLA_ID),
    "buscar disciplinas"
  );

  for (const d of disciplinasBanco ?? []) {
    disciplinasMap.set(normalizarTexto(d.nome), d.id);
  }
  console.log(`📋 Disciplinas já no banco: ${disciplinasMap.size}`);

  // ── 3. Criar disciplinas que ainda não existem ───────────────────────────
  console.log("📚 Criando disciplinas faltantes...");

  for (const turma of ALL_CLASSROOMS) {
    for (const subject of turma.subjects) {
      const chave = normalizarTexto(subject.name);

      if (!disciplinasMap.has(chave)) {
        const { data: criada, error } = await executarComRetry(
          () =>
            supabase
              .from("disciplinas")
              .insert({
                escola_id: ESCOLA_ID,
                codigo: subject.name.substring(0, 8).toUpperCase().replace(/\s/g, "_"),
                nome: subject.name,
                ativo: true,
                etapa: "AMBOS",
              })
              .select()
              .single(),
          `criar disciplina ${subject.name}`
        );

        if (error || !criada) {
          console.log(`❌ Erro disciplina ${subject.name}:`, error);
          continue;
        }

        disciplinasMap.set(chave, criada.id);
        console.log(`  ✅ Disciplina criada: ${subject.name}`);
        await sleep(100);
      }
    }
  }

  console.log(`📋 Total de disciplinas: ${disciplinasMap.size}\n`);

  // ── 4. Criar/atualizar turmas ─────────────────────────────────────────────
  console.log("🏫 Importando turmas...");

  const turmasMap = new Map<string, string>(); // classroom.id → uuid no banco

  for (const turma of ALL_CLASSROOMS) {
    const anoSerie = getAnoSerie(turma.name);
    const grupoPedagogico = getGrupoPedagogico(turma);

    const { data: existente } = await executarComRetry(
      () =>
        supabase
          .from("turmas")
          .select("id")
          .eq("escola_id", ESCOLA_ID)
          .eq("nome", turma.name)
          .maybeSingle(),
      `buscar turma ${turma.name}`
    );

    if (existente) {
      await executarComRetry(
        () =>
          supabase
            .from("turmas")
            .update({
              grupo_pedagogico: grupoPedagogico,
              etapa: turma.level,
              ano_serie: anoSerie,
              periodo: "Manhã",
              total_ativos: turma.totalActive,
              ativo: true,
            })
            .eq("id", existente.id),
        `atualizar turma ${turma.name}`
      );
      turmasMap.set(turma.id, existente.id);
      console.log(`  🔁 Turma atualizada: ${turma.name}`);
    } else {
      const { data: criada, error } = await executarComRetry(
        () =>
          supabase
            .from("turmas")
            .insert({
              escola_id: ESCOLA_ID,
              nome: turma.name,
              etapa: turma.level,
              ano_serie: anoSerie,
              periodo: "Manhã",
              total_ativos: turma.totalActive,
              grupo_pedagogico: grupoPedagogico,
              ativo: true,
            })
            .select()
            .single(),
        `criar turma ${turma.name}`
      );

      if (error || !criada) {
        console.log(`  ❌ Erro ao criar turma ${turma.name}:`, error);
        continue;
      }
      turmasMap.set(turma.id, criada.id);
      console.log(`  ✅ Turma criada: ${turma.name} [${grupoPedagogico}]`);
    }

    await sleep(100);
  }

  console.log();

  // ── 5. Criar matriz_disciplinas ───────────────────────────────────────────
  console.log("🗂️  Montando matriz de disciplinas por grupo pedagógico...");

  const matrizMap = new Map<string, string>(); // "GRUPO_C01" → disciplina_id
  const matrizControle = new Set<string>();

  for (const turma of ALL_CLASSROOMS) {
    const grupoPedagogico = getGrupoPedagogico(turma);

    for (const subject of turma.subjects) {
      const chave = `${grupoPedagogico}_${subject.code}`;

      if (matrizControle.has(chave)) continue;
      matrizControle.add(chave);

      const disciplinaId = disciplinasMap.get(normalizarTexto(subject.name));

      if (!disciplinaId) {
        console.log(`  ⚠️  Disciplina não encontrada no map: ${subject.name}`);
        continue;
      }

      const { error } = await executarComRetry(
        () =>
          supabase.from("matriz_disciplinas").insert({
            escola_id: ESCOLA_ID,
            etapa: grupoPedagogico,
            codigo: subject.code,
            disciplina_id: disciplinaId,
            ativo: true,
          }),
        `matriz ${grupoPedagogico} ${subject.code} ${subject.name}`
      );

      if (error) {
        console.log(`  ❌ Erro matriz ${grupoPedagogico} ${subject.code}:`, error);
        continue;
      }

      matrizMap.set(chave, disciplinaId);
      console.log(`  ✅ Matriz: ${grupoPedagogico} | ${subject.code} → ${subject.name}`);
      await sleep(120);
    }
  }

  console.log();

  // ── 6. Criar/atualizar alunos e inserir notas ─────────────────────────────
  console.log("👥 Importando alunos e notas...");

  let totalNotas = 0;
  let totalAlunos = 0;

  for (const turma of ALL_CLASSROOMS) {
    const turmaDbId = turmasMap.get(turma.id);
    const grupoPedagogico = getGrupoPedagogico(turma);

    if (!turmaDbId) {
      console.log(`  ⚠️  Turma sem ID no map: ${turma.name}`);
      continue;
    }

    console.log(`\n  📘 Turma: ${turma.name}`);

    for (const student of turma.students) {
      const eTransferido = Object.values(student.grades).every((g) => g === "TR");
      const status = eTransferido ? "TRANSFERIDO" : "ATIVO";

      const { data: existente } = await executarComRetry(
        () =>
          supabase
            .from("alunos")
            .select("id")
            .eq("escola_id", ESCOLA_ID)
            .eq("turma_id", turmaDbId)
            .eq("numero_chamada", student.id)
            .maybeSingle(),
        `buscar aluno ${student.name}`
      );

      let alunoId: string | undefined = existente?.id;

      if (alunoId) {
        await executarComRetry(
          () =>
            supabase
              .from("alunos")
              .update({ nome: student.name, status, em_atencao: student.isAttention })
              .eq("id", alunoId),
          `atualizar aluno ${student.name}`
        );
        console.log(`    🔁 ${student.name}`);
      } else {
        const { data: criado, error } = await executarComRetry(
          () =>
            supabase
              .from("alunos")
              .insert({
                escola_id: ESCOLA_ID,
                turma_id: turmaDbId,
                nome: student.name,
                numero_chamada: student.id,
                status,
                em_atencao: student.isAttention,
                ativo: true,
              })
              .select()
              .single(),
          `criar aluno ${student.name}`
        );

        if (error || !criado) {
          console.log(`    ❌ Erro criar aluno ${student.name}:`, error);
          continue;
        }

        alunoId = criado.id;
        totalAlunos++;
        console.log(`    ✅ ${student.name} [${status}]`);
      }

      if (!alunoId || eTransferido) continue;

      const notasParaInserir: NotaInsert[] = [];

      for (const [codigo, valor] of Object.entries(student.grades)) {
        if (typeof valor !== "number") continue;
        if (valor === 0) continue; // 0 = placeholder não preenchido, nunca inserir

        const chave = `${grupoPedagogico}_${codigo}`;
        const disciplinaId = matrizMap.get(chave);

        if (!disciplinaId) continue;

        notasParaInserir.push({
          escola_id: ESCOLA_ID,
          turma_id: turmaDbId,
          aluno_id: alunoId,
          disciplina_id: disciplinaId,
          ano_letivo: ANO_LETIVO,
          bimestre: BIMESTRE,
          nota: valor,
          status: "NORMAL",
        });
      }

      if (notasParaInserir.length > 0) {
        const { error } = await executarComRetry(
          () => supabase.from("notas").insert(notasParaInserir),
          `notas de ${student.name}`
        );

        if (error) {
          console.log(`    ❌ Erro nas notas de ${student.name}:`, error);
        } else {
          totalNotas += notasParaInserir.length;
        }
      }

      await sleep(130);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Alunos criados/atualizados: ${totalAlunos}`);
  console.log(`✅ Notas inseridas: ${totalNotas}`);
  console.log(`✅ Disciplinas no banco: ${disciplinasMap.size}`);
  console.log("🎉 IMPORTAÇÃO FINALIZADA COM SUCESSO");
}

importar().catch((error) => {
  console.error("💥 Erro fatal na importação:", error);
  process.exit(1);
});
