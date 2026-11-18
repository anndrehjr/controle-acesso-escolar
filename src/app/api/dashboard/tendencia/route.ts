import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import { buildRiscoAcademico } from "../../../../lib/analytics/buildRiscoAcademico";
import { cache } from "../../../../lib/cache";
import { resolveEscolaAccess, turmasVisiveis } from "../../../../lib/permissions";
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
    const turmaId = searchParams.get("turma") ?? undefined;
    const escolaIdParam = searchParams.get("escolaId");

    const perfil = await checkApiAuth(request);
    if (!perfil) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const escolaId = resolveEscolaAccess(perfil, escolaIdParam);
    if (!escolaId) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const turmasPermitidas = await turmasVisiveis(perfil, escolaId);
    if (turmaId && !turmasPermitidas.includes(turmaId)) {
      return NextResponse.json({ error: "Sem permissao para esta turma" }, { status: 403 });
    }
    const idsTurmasEscopo = turmaId ? [turmaId] : turmasPermitidas;

    const escolaRows = await db`SELECT ano_letivo FROM escolas WHERE id = ${escolaId} LIMIT 1`;
    const anoLetivo = (escolaRows[0]?.ano_letivo as number | undefined) ?? new Date().getFullYear();
    const escopoKey = turmaId ? `turma:${turmaId}` : `usuario:${perfil.id}`;

    const [alunos, disciplinas, matriz, turmas, todasNotas] = await Promise.all([
      cache.getOrSet(`tendencia:alunos:${escolaId}:${escopoKey}`, async () => {
        const rows = await db`
          SELECT * FROM alunos
          WHERE escola_id = ${escolaId}
            AND ativo = true
            AND turma_id = ANY(${idsTurmasEscopo}::uuid[])
        `;
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
      cache.getOrSet(`tendencia:turmas:${escolaId}:${escopoKey}`, async () => {
        const rows = await db`
          SELECT * FROM turmas
          WHERE escola_id = ${escolaId} AND id = ANY(${idsTurmasEscopo}::uuid[])
        `;
        return rows as unknown as Turma[];
      }),
      cache.getOrSet(`tendencia:notas:${escolaId}:${escopoKey}:ano:${anoLetivo}`, async () => {
        const rows = await db`
          SELECT * FROM notas
          WHERE escola_id = ${escolaId}
            AND ano_letivo = ${anoLetivo}
            AND turma_id = ANY(${idsTurmasEscopo}::uuid[])
        `;
        return rows as unknown as Nota[];
      }),
    ]);

    const turmaData = turmaId
      ? turmas.find((turma) => turma.id === turmaId) ?? null
      : null;

    const labels: Record<number, string> = {
      1: "1o Bim",
      2: "2o Bim",
      3: "3o Bim",
      4: "4o Bim",
    };

    const pontos = [1, 2, 3, 4].map((bimestre) => {
      const notasBim = todasNotas.filter((n) => Number(n.bimestre) === bimestre);
      const notasAte = todasNotas.filter((n) => Number(n.bimestre) <= bimestre);

      const dashboard = buildSchoolDashboard({
        alunos,
        notas: notasBim,
        turmas,
        disciplinas,
        bimestre,
        anoLetivo,
      });

      const temDados = dashboard.notasValidas.length > 0;
      const alertas = buildRiscoAcademico({
        alunos,
        notas: notasAte,
        turmas,
        disciplinas,
        matriz,
      });

      return {
        bimestre,
        label: labels[bimestre],
        media: temDados ? Number(dashboard.mediaGeral.toFixed(2)) : null,
        totalNotas: dashboard.notasValidas.length,
        alunosCriticos: alertas.criticos.length,
        alunosAtencao: alertas.atencao.length,
        percentualAdequado: temDados
          ? Number(dashboard.percentualAdequado.toFixed(1))
          : null,
        temDados,
      };
    });

    return NextResponse.json({
      turma: turmaData,
      pontos,
    });
  } catch (err) {
    console.error("[tendencia]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
