import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import db from "../../../lib/db";
import { cache } from "../../../lib/cache";
import { capabilitiesFor } from "../../../types/roles";
import { resolveEscolaAccess, podeVerTurma } from "../../../lib/permissions";
import { registrarAuditoria } from "../../../lib/audit";

const BIMESTRES_VALIDOS = [1, 2, 3, 4];

type NotaEntrada = {
  alunoId?: string;
  disciplinaId?: string;
  turmaId?: string;
  bimestre?: number;
  anoLetivo?: number;
  nota?: number;
};

type NotaResultado = {
  alunoId: string;
  disciplinaId: string;
  bimestre: number;
  ok: boolean;
  erro?: string;
};

function validarEntrada(item: NotaEntrada): string | null {
  if (!item.alunoId || !item.disciplinaId || !item.turmaId) {
    return "alunoId, disciplinaId e turmaId são obrigatórios";
  }
  if (!BIMESTRES_VALIDOS.includes(Number(item.bimestre))) {
    return "bimestre precisa ser 1, 2, 3 ou 4";
  }
  if (!Number.isInteger(Number(item.anoLetivo)) || Number(item.anoLetivo) < 2000) {
    return "anoLetivo inválido";
  }
  const nota = Number(item.nota);
  if (Number.isNaN(nota) || nota < 0 || nota > 10) {
    return "nota precisa ser um número entre 0 e 10";
  }
  return null;
}

/**
 * GET /api/notas?escolaId=...&turmaId=...&bimestre=...&anoLetivo=...&page=1&pageSize=50
 * Lista notas de uma turma/bimestre, paginado. Mesmo escopo de leitura já usado no resto do
 * dashboard (resolveEscolaAccess + podeVerTurma) — PROFESSOR só vê as turmas vinculadas.
 */
export async function GET(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const escolaId = resolveEscolaAccess(perfil, searchParams.get("escolaId"));
  if (!escolaId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const turmaId = searchParams.get("turmaId");
  if (!turmaId || !(await podeVerTurma(perfil, escolaId, turmaId))) {
    return NextResponse.json({ error: "Sem permissão para esta turma" }, { status: 403 });
  }

  const bimestre = Number(searchParams.get("bimestre") ?? "1");
  const anoLetivo = Number(searchParams.get("anoLetivo") ?? new Date().getFullYear());
  if (!BIMESTRES_VALIDOS.includes(bimestre)) {
    return NextResponse.json({ error: "bimestre inválido" }, { status: 400 });
  }

  // Paginação (F-09 da auditoria): página 1-based, tamanho de página limitado a 200 pra evitar
  // que um cliente mal-intencionado peça a tabela inteira de uma vez.
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? "50")));
  const offset = (page - 1) * pageSize;

  const [rows, totalRows] = await Promise.all([
    db`
      SELECT n.id, n.aluno_id, a.nome AS aluno_nome, a.numero_chamada,
             n.disciplina_id, d.nome AS disciplina_nome, n.bimestre, n.ano_letivo, n.nota
      FROM notas n
      JOIN alunos a ON a.id = n.aluno_id
      JOIN disciplinas d ON d.id = n.disciplina_id
      WHERE n.escola_id = ${escolaId} AND n.turma_id = ${turmaId}
        AND n.bimestre = ${bimestre} AND n.ano_letivo = ${anoLetivo}
      ORDER BY a.numero_chamada, d.nome
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    db`
      SELECT count(*)::int AS total FROM notas
      WHERE escola_id = ${escolaId} AND turma_id = ${turmaId}
        AND bimestre = ${bimestre} AND ano_letivo = ${anoLetivo}
    `,
  ]);

  const total = totalRows[0]?.total ?? 0;

  return NextResponse.json({
    data: rows,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
}

/**
 * POST /api/notas — lança ou edita notas (F-01 da auditoria). Body: { notas: [...] } (1 ou mais).
 * Upsert por (aluno_id, disciplina_id, bimestre, ano_letivo) — a mesma constraint única do F-05
 * garante que isso nunca duplica linha, só substitui a nota quando já existe.
 * Cada entrada é auditada individualmente (dado anterior + novo) e a permissão é checada por
 * turma — PROFESSOR só lança nas turmas vinculadas a ele.
 */
export async function POST(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!capabilitiesFor(perfil.role).manageNotas) {
    return NextResponse.json({ error: "Sem permissão para lançar notas" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { escolaId?: string; notas?: NotaEntrada[] } | null;
  const entradas = body?.notas;
  if (!Array.isArray(entradas) || entradas.length === 0) {
    return NextResponse.json({ error: "Envie { escolaId, notas: [...] } com pelo menos 1 item" }, { status: 400 });
  }
  if (entradas.length > 200) {
    return NextResponse.json({ error: "Máximo de 200 notas por requisição" }, { status: 400 });
  }

  // escolaId é do corpo da requisição (não do escopo implícito do usuário) — necessário pra um
  // SUPER_ADMIN sem escola própria conseguir lançar nota em qualquer escola; resolveEscolaAccess
  // ainda garante que ninguém lança fora do que tem permissão de ver.
  const escolaId = resolveEscolaAccess(perfil, body?.escolaId ?? null);
  if (!escolaId) {
    return NextResponse.json({ error: "Sem permissão para esta escola" }, { status: 403 });
  }

  const resultados: NotaResultado[] = [];
  const turmasVerificadas = new Map<string, boolean>();
  const turmasAfetadas = new Set<string>();

  for (const item of entradas) {
    const erroValidacao = validarEntrada(item);
    const alunoId = item.alunoId ?? "";
    const disciplinaId = item.disciplinaId ?? "";
    const turmaId = item.turmaId ?? "";
    const bimestre = Number(item.bimestre);

    if (erroValidacao) {
      resultados.push({ alunoId, disciplinaId, bimestre, ok: false, erro: erroValidacao });
      continue;
    }

    if (!turmasVerificadas.has(turmaId)) {
      turmasVerificadas.set(turmaId, await podeVerTurma(perfil, escolaId, turmaId));
    }
    if (!turmasVerificadas.get(turmaId)) {
      resultados.push({ alunoId, disciplinaId, bimestre, ok: false, erro: "Sem permissão para esta turma" });
      continue;
    }

    // Confere que o aluno realmente pertence à turma informada — evita lançar nota de um aluno
    // de outra turma usando o escopo liberado desta.
    const alunoRows = await db`SELECT turma_id FROM alunos WHERE id = ${alunoId} AND escola_id = ${escolaId} LIMIT 1`;
    if (!alunoRows[0] || alunoRows[0].turma_id !== turmaId) {
      resultados.push({ alunoId, disciplinaId, bimestre, ok: false, erro: "Aluno não pertence a esta turma" });
      continue;
    }

    const anterior = await db`
      SELECT nota FROM notas
      WHERE aluno_id = ${alunoId} AND disciplina_id = ${disciplinaId}
        AND bimestre = ${bimestre} AND ano_letivo = ${Number(item.anoLetivo)}
      LIMIT 1
    `;

    try {
      await db`
        INSERT INTO notas (escola_id, turma_id, aluno_id, disciplina_id, ano_letivo, bimestre, nota)
        VALUES (${escolaId}, ${turmaId}, ${alunoId}, ${disciplinaId}, ${Number(item.anoLetivo)}, ${bimestre}, ${Number(item.nota)})
        ON CONFLICT (aluno_id, disciplina_id, bimestre, ano_letivo)
        DO UPDATE SET nota = EXCLUDED.nota
      `;

      await registrarAuditoria({
        usuario: perfil,
        acao: anterior[0] ? "NOTA_EDITADA" : "NOTA_LANCADA",
        tela: "/api/notas",
        req: request,
        dadosAnteriores: anterior[0] ? { nota: anterior[0].nota } : undefined,
        dadosNovos: { alunoId, disciplinaId, turmaId, bimestre, anoLetivo: Number(item.anoLetivo), nota: Number(item.nota) },
      });

      turmasAfetadas.add(turmaId);
      resultados.push({ alunoId, disciplinaId, bimestre, ok: true });
    } catch (err) {
      console.error("[notas] falha ao gravar:", err);
      resultados.push({ alunoId, disciplinaId, bimestre, ok: false, erro: "Falha ao gravar (verifique os IDs)" });
    }
  }

  // Invalidação ativa de cache (achado da auditoria): sem isso, o dashboard podia mostrar dado
  // desatualizado por até 5 minutos (TTL do cache) depois de uma nota lançada/editada.
  if (turmasAfetadas.size > 0) {
    cache.invalidateAll();
  }

  const sucesso = resultados.filter((r) => r.ok).length;
  const falhas = resultados.length - sucesso;

  return NextResponse.json(
    { resultados, resumo: { total: resultados.length, sucesso, falhas } },
    { status: falhas > 0 && sucesso === 0 ? 400 : 200 }
  );
}
