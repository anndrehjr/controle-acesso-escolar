import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import { cache } from "../../../../lib/cache";
import type { Aluno, Disciplina, Nota, Turma } from "../../../../lib/analytics/types";

const ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get("turma") ?? undefined;

    if (!(await checkApiAuth(request))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const alunosKey = turmaId ? `alunos:${ESCOLA_ID}:turma:${turmaId}` : `alunos:${ESCOLA_ID}`;
    const turmasKey = turmaId ? `turmas:${ESCOLA_ID}:${turmaId}` : `turmas:${ESCOLA_ID}`;
    const notasKey = turmaId ? `notas:${ESCOLA_ID}:turma:${turmaId}` : `notas:${ESCOLA_ID}`;

    const escolaRows = await db`SELECT ano_letivo FROM escolas WHERE id = ${ESCOLA_ID} LIMIT 1`;
    const anoLetivo = (escolaRows[0]?.ano_letivo as number | undefined) ?? new Date().getFullYear();

    const turmaData = turmaId
      ? await cache.getOrSet(`turma:${turmaId}`, async () => {
          const rows = await db`SELECT id, nome FROM turmas WHERE id = ${turmaId} LIMIT 1`;
          return (rows[0] ?? null) as { id: string; nome: string } | null;
        })
      : null;

    const [alunos, disciplinas] = await Promise.all([
      cache.getOrSet(alunosKey, async () => {
        const rows = turmaId
          ? await db`SELECT * FROM alunos WHERE turma_id = ${turmaId} AND ativo = true`
          : await db`SELECT * FROM alunos WHERE escola_id = ${ESCOLA_ID} AND ativo = true`;
        return rows as unknown as Aluno[];
      }),
      cache.getOrSet(`disciplinas:${ESCOLA_ID}`, async () => {
        const rows = await db`SELECT * FROM disciplinas WHERE escola_id = ${ESCOLA_ID}`;
        return rows as unknown as Disciplina[];
      }),
    ]);

    const turmas = await cache.getOrSet(turmasKey, async () => {
      const rows = turmaId
        ? await db`SELECT * FROM turmas WHERE id = ${turmaId}`
        : await db`SELECT * FROM turmas WHERE escola_id = ${ESCOLA_ID}`;
      return rows as unknown as Turma[];
    });

    const todasNotas = await cache.getOrSet(notasKey, async () => {
      const rows = turmaId
        ? await db`SELECT * FROM notas WHERE escola_id = ${ESCOLA_ID} AND turma_id = ${turmaId}`
        : await db`SELECT * FROM notas WHERE escola_id = ${ESCOLA_ID}`;
      return rows as unknown as Nota[];
    });

    const labels: Record<number, string> = {
      1: "1º Bim",
      2: "2º Bim",
      3: "3º Bim",
      4: "4º Bim",
    };

    const pontos = [1, 2, 3, 4].map((bimestre) => {
      const dashboard = buildSchoolDashboard({
        alunos,
        notas: todasNotas,
        turmas,
        disciplinas,
        bimestre,
        anoLetivo,
      });

      const temDados = dashboard.notasValidas.length > 0;

      return {
        bimestre,
        label: labels[bimestre],
        media: temDados ? Number(dashboard.mediaGeral.toFixed(2)) : null,
        totalNotas: dashboard.notasValidas.length,
        alunosCriticos: dashboard.alunosCriticos.length,
        percentualAdequado: temDados
          ? Number(dashboard.percentualAdequado.toFixed(1))
          : null,
        temDados,
      };
    });

    return NextResponse.json({
      turma: turmaData ?? null,
      pontos,
    });
  } catch (err) {
    console.error("[tendencia]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
