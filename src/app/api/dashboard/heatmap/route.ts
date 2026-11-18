import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildHeatmapPedagogico } from "../../../../lib/analytics/buildHeatmapPedagogico";
import { buildRiscoAcademico } from "../../../../lib/analytics/buildRiscoAcademico";
import { cache } from "../../../../lib/cache";
import { resolveEscolaAccess, turmasVisiveis, podeVerTurma } from "../../../../lib/permissions";
import { capabilitiesFor } from "../../../../types/roles";

import type {
  Aluno,
  Disciplina,
  MatrizDisciplina,
  Nota,
  Turma,
} from "../../../../lib/analytics/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const escolaIdParam = searchParams.get("escolaId");

    const perfil = await checkApiAuth(request);
    if (!perfil) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const escolaId = resolveEscolaAccess(perfil, escolaIdParam);
    if (!escolaId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const bimestre = Number(searchParams.get("bimestre") ?? "1");
    const turmaId = searchParams.get("turma");

    if (turmaId && !(await podeVerTurma(perfil, escolaId, turmaId))) {
      return NextResponse.json({ error: "Sem permissão para esta turma" }, { status: 403 });
    }

    const restringirTurma = !capabilitiesFor(perfil.role).viewAllTurmasDaEscola;
    const turmasPermitidas = restringirTurma ? await turmasVisiveis(perfil, escolaId) : null;

    const turmasKey = turmaId ? `turmas:${escolaId}:${turmaId}` : `turmas:${escolaId}`;
    const alunosKey = turmaId ? `alunos:${escolaId}:turma:${turmaId}` : `alunos:${escolaId}`;

    const escolaRows = await db`SELECT * FROM escolas WHERE id = ${escolaId} LIMIT 1`;
    const escola = escolaRows[0];
    if (!escola) {
      return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 });
    }
    const bimestreAtual = (escola.bimestre_atual as number | undefined) ?? 1;
    const anoLetivo = (escola.ano_letivo as number | undefined) ?? 2026;

    const [turmasBrutas, alunosBrutos, disciplinas, matriz] = await Promise.all([
      cache.getOrSet(turmasKey, async () => {
        const rows = turmaId
          ? await db`SELECT * FROM turmas WHERE escola_id = ${escolaId} AND id = ${turmaId} ORDER BY ano_serie ASC`
          : await db`SELECT * FROM turmas WHERE escola_id = ${escolaId} ORDER BY ano_serie ASC`;
        return rows as unknown as Turma[];
      }),
      cache.getOrSet(alunosKey, async () => {
        const rows = turmaId
          ? await db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND ativo = true AND turma_id = ${turmaId}`
          : await db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND ativo = true`;
        return rows as unknown as Aluno[];
      }),
      cache.getOrSet(`disciplinas:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM disciplinas WHERE escola_id = ${escolaId}`;
        return rows as unknown as Disciplina[];
      }),
      cache.getOrSet(`matriz:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM matriz_disciplinas WHERE escola_id = ${escolaId}`;
        return rows as unknown as MatrizDisciplina[];
      }),
    ]);

    const todasNotas = await cache.getOrSet(`notas:${escolaId}`, async () => {
      const rows = await db`SELECT * FROM notas WHERE escola_id = ${escolaId}`;
      return rows as unknown as Nota[];
    });

    const notasBimestreSelecionado = todasNotas.filter(
      (n) => Number(n.bimestre) === bimestre && Number(n.ano_letivo) === anoLetivo
    );
    // Todos os bimestres já lançados até o bimestre atual da escola — mesmo recorte
    // usado em /api/dashboard/kpis, pra classificar quem está Pré-Reprovado de forma
    // consistente em todo o sistema, independente do bimestre em exibição no heatmap.
    const notasAcumuladas = todasNotas.filter(
      (n) => Number(n.bimestre) <= bimestreAtual && Number(n.ano_letivo) === anoLetivo
    );

    const turmas = turmasPermitidas ? turmasBrutas.filter((t) => turmasPermitidas.includes(t.id)) : turmasBrutas;
    const alunos = turmasPermitidas
      ? alunosBrutos.filter((a) => turmasPermitidas.includes(a.turma_id as string))
      : alunosBrutos;
    const notas = turmasPermitidas
      ? notasBimestreSelecionado.filter((n) => turmasPermitidas.includes(n.turma_id as string))
      : notasBimestreSelecionado;
    const notasAno = turmasPermitidas
      ? notasAcumuladas.filter((n) => turmasPermitidas.includes(n.turma_id as string))
      : notasAcumuladas;

    const heatmap = buildHeatmapPedagogico({
      alunos,
      notas,
      turmas,
      disciplinas,
      matriz,
    });

    // Classificação Pré-Reprovado (3+ disciplinas em risco pela média acumulada do ano) —
    // mesma regra central usada no dashboard/alertas/perfil do aluno, independente do
    // bimestre selecionado aqui no heatmap.
    const risco = buildRiscoAcademico({ alunos, notas: notasAno, turmas, disciplinas, matriz });
    const preReprovados = new Set(risco.criticos.map((c) => c.alunoId));

    const heatmapComStatus = heatmap.map((turmaLinha) => ({
      ...turmaLinha,
      alunos: turmaLinha.alunos.map((linha) => ({
        ...linha,
        preReprovado: preReprovados.has(linha.alunoId),
      })),
    }));

    return NextResponse.json({ data: heatmapComStatus });
  } catch (err) {
    console.error("[heatmap]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
