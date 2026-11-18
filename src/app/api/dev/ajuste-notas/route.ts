import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { checkApiAuth, podeAjustarNotas } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { cache } from "../../../../lib/cache";

const BIMESTRES_VALIDOS = [1, 2, 3, 4];
type Alteracao = { alunoId: string; disciplinaId: string; notaAnterior: number | null; notaNova: number };
function ipDe(req: Request) { return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null; }
async function autenticar(req: Request) { const perfil = await checkApiAuth(req); return podeAjustarNotas(perfil) ? perfil : null; }

export async function GET(request: Request) {
  const perfil = await autenticar(request);
  if (!perfil) return NextResponse.json({ error: "Sem permissão para ajustar notas" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const turmaId = searchParams.get("turmaId");
  const bimestre = Number(searchParams.get("bimestre") ?? "1");
  const anoLetivo = Number(searchParams.get("anoLetivo") ?? new Date().getFullYear());
  if (!turmaId) {
    const [escolas, turmas] = await Promise.all([
      db`SELECT id, nome, ano_letivo FROM escolas ORDER BY nome`,
      db`SELECT id, escola_id, nome, grupo_pedagogico FROM turmas WHERE ativo = true ORDER BY escola_id, ano_serie, nome`,
    ]);
    return NextResponse.json({ escolas, turmas });
  }
  if (!BIMESTRES_VALIDOS.includes(bimestre) || !Number.isInteger(anoLetivo)) return NextResponse.json({ error: "Bimestre ou ano letivo inválido" }, { status: 400 });
  const turmas = await db`SELECT id, escola_id, nome, grupo_pedagogico FROM turmas WHERE id = ${turmaId} AND ativo = true LIMIT 1`;
  const turma = turmas[0];
  if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  const [alunos, disciplinas, notas] = await Promise.all([
    db`SELECT id, nome, numero_chamada FROM alunos WHERE turma_id = ${turmaId} AND escola_id = ${turma.escola_id} AND ativo = true ORDER BY numero_chamada, nome`,
    db`SELECT DISTINCT d.id, d.nome, m.codigo FROM matriz_disciplinas m JOIN disciplinas d ON d.id = m.disciplina_id AND d.ativo = true WHERE m.escola_id = ${turma.escola_id} AND m.etapa = ${turma.grupo_pedagogico} AND m.ativo = true ORDER BY m.codigo, d.nome`,
    db`SELECT aluno_id, disciplina_id, nota FROM notas WHERE turma_id = ${turmaId} AND escola_id = ${turma.escola_id} AND bimestre = ${bimestre} AND ano_letivo = ${anoLetivo}`,
  ]);
  return NextResponse.json({ turma, alunos, disciplinas, notas });
}

function parse(value: unknown): Alteracao | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const alunoId = typeof v.alunoId === "string" ? v.alunoId : "";
  const disciplinaId = typeof v.disciplinaId === "string" ? v.disciplinaId : "";
  const notaNova = Number(v.notaNova);
  const notaAnterior = v.notaAnterior == null ? null : Number(v.notaAnterior);
  if (!alunoId || !disciplinaId || !Number.isFinite(notaNova) || notaNova < 0 || notaNova > 10) return null;
  if (notaAnterior !== null && (!Number.isFinite(notaAnterior) || notaAnterior < 0 || notaAnterior > 10)) return null;
  return { alunoId, disciplinaId, notaAnterior, notaNova };
}

export async function POST(request: Request) {
  const perfil = await autenticar(request);
  if (!perfil) return NextResponse.json({ error: "Sem permissão para ajustar notas" }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const escolaId = typeof body?.escolaId === "string" ? body.escolaId : "";
  const turmaId = typeof body?.turmaId === "string" ? body.turmaId : "";
  const motivo = typeof body?.motivo === "string" ? body.motivo.trim() : "";
  const bimestre = Number(body?.bimestre), anoLetivo = Number(body?.anoLetivo);
  const recebidas = Array.isArray(body?.alteracoes) ? body.alteracoes : [];
  const parsed = recebidas.map(parse);
  if (!escolaId || !turmaId || parsed.length === 0 || parsed.some((v) => v === null)) return NextResponse.json({ error: "Lote vazio ou contém alteração inválida" }, { status: 400 });
  if (parsed.length > 500) return NextResponse.json({ error: "Máximo de 500 alterações por lote" }, { status: 400 });
  if (!BIMESTRES_VALIDOS.includes(bimestre) || !Number.isInteger(anoLetivo)) return NextResponse.json({ error: "Bimestre ou ano letivo inválido" }, { status: 400 });
  if (motivo.length < 10 || motivo.length > 500) return NextResponse.json({ error: "Informe um motivo entre 10 e 500 caracteres" }, { status: 400 });
  const itens = parsed as Alteracao[];
  if (new Set(itens.map((v) => `${v.alunoId}:${v.disciplinaId}`)).size !== itens.length) return NextResponse.json({ error: "O lote contém células duplicadas" }, { status: 400 });
  const alunoIds = [...new Set(itens.map((v) => v.alunoId))], disciplinaIds = [...new Set(itens.map((v) => v.disciplinaId))];
  const batchId = randomUUID();
  try {
    const resultado = await db.begin(async (tx) => {
      const turmas = await tx`SELECT grupo_pedagogico FROM turmas WHERE id = ${turmaId} AND escola_id = ${escolaId} AND ativo = true LIMIT 1`;
      if (!turmas[0]) throw new Error("TURMA_INVALIDA");
      const [alunos, disciplinas, atuais] = await Promise.all([
        tx`SELECT id, nome FROM alunos WHERE id = ANY(${alunoIds}::uuid[]) AND turma_id = ${turmaId} AND escola_id = ${escolaId} AND ativo = true`,
        tx`SELECT DISTINCT d.id, d.nome FROM matriz_disciplinas m JOIN disciplinas d ON d.id = m.disciplina_id AND d.ativo = true WHERE m.escola_id = ${escolaId} AND m.etapa = ${turmas[0].grupo_pedagogico} AND m.ativo = true AND d.id = ANY(${disciplinaIds}::uuid[])`,
        tx`SELECT id, aluno_id, disciplina_id, nota FROM notas WHERE aluno_id = ANY(${alunoIds}::uuid[]) AND disciplina_id = ANY(${disciplinaIds}::uuid[]) AND bimestre = ${bimestre} AND ano_letivo = ${anoLetivo} FOR UPDATE`,
      ]);
      if (alunos.length !== alunoIds.length) throw new Error("ALUNO_INVALIDO");
      if (disciplinas.length !== disciplinaIds.length) throw new Error("DISCIPLINA_INVALIDA");
      const alunoNome = new Map(alunos.map((v) => [v.id, v.nome])), disciplinaNome = new Map(disciplinas.map((v) => [v.id, v.nome]));
      const atual = new Map(atuais.map((v) => [`${v.aluno_id}:${v.disciplina_id}`, v]));
      for (const item of itens) {
        const linha = atual.get(`${item.alunoId}:${item.disciplinaId}`);
        const notaBanco = linha?.nota == null ? null : Number(linha.nota);
        if (notaBanco !== item.notaAnterior) throw new Error("CONFLITO_NOTA");
        if (notaBanco === item.notaNova) throw new Error("SEM_ALTERACAO");
      }
      const linhas = itens.map((v) => ({ escola_id: escolaId, turma_id: turmaId, aluno_id: v.alunoId, disciplina_id: v.disciplinaId, ano_letivo: anoLetivo, bimestre, nota: v.notaNova }));
      const gravadas = await tx`INSERT INTO notas ${tx(linhas, "escola_id", "turma_id", "aluno_id", "disciplina_id", "ano_letivo", "bimestre", "nota")} ON CONFLICT (aluno_id, disciplina_id, bimestre, ano_letivo) DO UPDATE SET nota = EXCLUDED.nota RETURNING id, aluno_id, disciplina_id`;
      const ids = new Map(gravadas.map((v) => [`${v.aluno_id}:${v.disciplina_id}`, v.id]));
      const logs = itens.map((v) => ({ usuario_id: perfil.id, usuario_email: perfil.email, role: perfil.role, escola_id: escolaId, acao: "NOTAS_AJUSTADAS_LOTE", tabela: "notas", registro_id: ids.get(`${v.alunoId}:${v.disciplinaId}`), tela: "/dashboard/ajustar-notas", ip: ipDe(request), user_agent: request.headers.get("user-agent"), dados_anteriores: JSON.stringify({ nota: v.notaAnterior }), dados_novos: JSON.stringify({ batchId, motivo, nota: v.notaNova, alunoId: v.alunoId, alunoNome: alunoNome.get(v.alunoId), disciplinaId: v.disciplinaId, disciplinaNome: disciplinaNome.get(v.disciplinaId), turmaId, bimestre, anoLetivo }), sucesso: true }));
      await tx`INSERT INTO logs_acesso ${tx(logs, "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
      return { total: itens.length, alunosAfetados: alunoIds.length };
    });
    cache.invalidateAll();
    return NextResponse.json({ ok: true, batchId, ...resultado });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const msg: Record<string, string> = { TURMA_INVALIDA: "Turma inválida", ALUNO_INVALIDO: "Um ou mais alunos não pertencem à turma", DISCIPLINA_INVALIDA: "Uma ou mais disciplinas não pertencem à turma", CONFLITO_NOTA: "Uma nota foi alterada por outra sessão. Recarregue a turma", SEM_ALTERACAO: "O lote contém uma nota sem alteração real" };
    if (msg[code]) return NextResponse.json({ error: msg[code] }, { status: code === "CONFLITO_NOTA" ? 409 : 400 });
    console.error("[ajuste-notas-lote]", error);
    return NextResponse.json({ error: "Não foi possível salvar o lote. Nenhuma nota foi alterada" }, { status: 500 });
  }
}
