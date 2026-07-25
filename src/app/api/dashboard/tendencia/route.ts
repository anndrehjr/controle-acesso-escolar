import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import { buildAlertas } from "../../../../lib/analytics/buildAlertas";
import { cache } from "../../../../lib/cache";
import { resolveEscolaAccess, podeVerTurma } from "../../../../lib/permissions";
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
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const escolaId = resolveEscolaAccess(perfil, escolaIdParam);
    if (!escolaId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (turmaId && !(await podeVerTurma(perfil, escolaId, turmaId))) {
      return NextResponse.json({ error: "Sem permissão para esta turma" }, { status: 403 });
    }

    const turmasKey = turmaId ? `turmas:${escolaId}:${turmaId}` : `turmas:${escolaId}`;
    const alunosKey = turmaId ? `alunos:${escolaId}:turma:${turmaId}` : `alunos:${escolaId}`;
    const notasKey = turmaId ? `notas:${escolaId}:turma:${turmaId}` : `notas:${escolaId}`;

    const escolaRows = await db`SELECT ano_letivo FROM escolas WHERE id = ${escolaId} LIMIT 1`;
    const anoLetivo = (escolaRows[0]?.ano_letivo as number | undefined) ?? new Date().getFullYear();

    const turmaData = turmaId
      ? await cache.getOrSet(`turma:${turmaId}`, async () => {
          const rows = await db`SELECT id, nome FROM turmas WHERE id = ${turmaId} LIMIT 1`;
          return (rows[0] ?? null) as { id: string; nome: string } | null;
        })
      : null;

    const [alunos, disciplinas, matriz] = await Promise.all([
      cache.getOrSet(alunosKey, async () => {
        const rows = turmaId
          // escola_id always required for security
          ? await db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND turma_id = ${turmaId} AND ativo = true`
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

    const turmas = await cache.getOrSet(turmasKey, async () => {
      const rows = turmaId
        ? await db`SELECT * FROM turmas WHERE escola_id = ${escolaId} AND id = ${turmaId}`
        : await db`SELECT * FROM turmas WHERE escola_id = ${escolaId}`;
      return rows as unknown as Turma[];
    });

    const todasNotas = await cache.getOrSet(notasKey, async () => {
      const rows = turmaId
        ? await db`SELECT * FROM notas WHERE escola_id = ${escolaId} AND turma_id = ${turmaId}`
        : await db`SELECT * FROM notas WHERE escola_id = ${escolaId}`;
      return rows as unknown as Nota[];
    });

    const labels: Record<number, string> = {
      1: "1º Bim",
      2: "2º Bim",
      3: "3º Bim",
      4: "4º Bim",
    };

    const pontos = [1, 2, 3, 4].map((bimestre) => {
      // Filter notes to this bimestre for both dashboard and alertas
      const notasBim = todasNotas.filter(
        (n) => Number(n.bimestre) === bimestre && Number(n.ano_letivo) === anoLetivo
      );

      const dashboard = buildSchoolDashboard({
        alunos,
        notas: notasBim,
        turmas,
        disciplinas,
        bimestre,
        anoLetivo,
      });

      const temDados = dashboard.notasValidas.length > 0;

      // Same rule as SSR: 4+ disciplines < 5 = crítico
      const alertas = buildAlertas({ alunos, notas: notasBim, turmas, disciplinas, matriz });

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
      turma: turmaData ?? null,
      pontos,
    });
  } catch (err) {
    console.error("[tendencia]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
