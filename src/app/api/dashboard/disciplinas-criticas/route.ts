import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import { cache } from "../../../../lib/cache";
import { resolveEscolaAccess, turmasVisiveis } from "../../../../lib/permissions";
import { capabilitiesFor } from "../../../../types/roles";

import type {
  Aluno,
  Disciplina,
  Nota,
  Turma,
} from "../../../../lib/analytics/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const escolaId = searchParams.get("escolaId");

    if (!escolaId) {
      return NextResponse.json({ error: "escolaId obrigatório" }, { status: 400 });
    }

    const perfil = await checkApiAuth(request);
    if (!perfil) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const escolaResolvida = resolveEscolaAccess(perfil, escolaId);
    if (!escolaResolvida) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const escolaRows = await db`SELECT * FROM escolas WHERE id = ${escolaResolvida} LIMIT 1`;
    const escola = escolaRows[0];

    if (!escola) {
      return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 });
    }

    const [turmas, alunos, disciplinas] = await Promise.all([
      cache.getOrSet(`turmas:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM turmas WHERE escola_id = ${escolaId}`;
        return rows as unknown as Turma[];
      }),
      cache.getOrSet(`alunos:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND ativo = true`;
        return rows as unknown as Aluno[];
      }),
      cache.getOrSet(`disciplinas:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM disciplinas WHERE escola_id = ${escolaId}`;
        return rows as unknown as Disciplina[];
      }),
    ]);

    const bimestreAtual = (escola.bimestre_atual as number | undefined) ?? 1;
    const anoLetivo = (escola.ano_letivo as number | undefined) ?? 2026;

    const notas = await cache.getOrSet(`notas:${escolaId}:bim:${bimestreAtual}`, async () => {
      const rows = await db`SELECT * FROM notas WHERE escola_id = ${escolaId} AND bimestre = ${bimestreAtual} AND ano_letivo = ${anoLetivo}`;
      return rows as unknown as Nota[];
    });

    // PROFESSOR só vê as turmas vinculadas a ele; demais papéis com viewAllTurmasDaEscola veem tudo.
    const restringirTurma = !capabilitiesFor(perfil.role).viewAllTurmasDaEscola;
    const turmasPermitidas = restringirTurma ? await turmasVisiveis(perfil, escolaResolvida) : null;
    const turmasEscopo = turmasPermitidas ? turmas.filter((t) => turmasPermitidas.includes(t.id)) : turmas;
    const alunosEscopo = turmasPermitidas
      ? alunos.filter((a) => turmasPermitidas.includes(a.turma_id as string))
      : alunos;
    const notasEscopo = turmasPermitidas
      ? notas.filter((n) => turmasPermitidas.includes(n.turma_id as string))
      : notas;

    const dashboard = buildSchoolDashboard({
      alunos: alunosEscopo,
      notas: notasEscopo,
      turmas: turmasEscopo,
      disciplinas,
      bimestre: bimestreAtual,
      anoLetivo,
    });

    return NextResponse.json({
      data: {
        geral: dashboard.disciplinasCriticasGeral,
        fundamental: dashboard.disciplinasCriticasFundamental,
        medio: dashboard.disciplinasCriticasMedio,
        disciplinaMaisCritica: dashboard.disciplinaMaisCritica,
      },
    });
  } catch (err) {
    console.error("[disciplinas-criticas]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
