import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import { cache } from "../../../../lib/cache";
import { resolveEscolaAccess, podeVerTurma } from "../../../../lib/permissions";
import type { Aluno, Disciplina, Nota, Turma } from "../../../../lib/analytics/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get("turma");
    const escolaIdParam = searchParams.get("escolaId");

    if (!turmaId) {
      return NextResponse.json({ error: "turma obrigatória" }, { status: 400 });
    }

    const perfil = await checkApiAuth(request);
    if (!perfil) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const escolaId = resolveEscolaAccess(perfil, escolaIdParam);
    if (!escolaId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!(await podeVerTurma(perfil, escolaId, turmaId))) {
      return NextResponse.json({ error: "Sem permissão para esta turma" }, { status: 403 });
    }

    const [turmaData, alunos, disciplinas] = await Promise.all([
      cache.getOrSet(`turma:${turmaId}`, async () => {
        const rows = await db`SELECT * FROM turmas WHERE id = ${turmaId} AND escola_id = ${escolaId} LIMIT 1`;
        return (rows[0] ?? null) as Turma | null;
      }),
      cache.getOrSet(`alunos:${escolaId}:turma:${turmaId}`, async () => {
        const rows = await db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND turma_id = ${turmaId} AND ativo = true`;
        return rows as unknown as Aluno[];
      }),
      cache.getOrSet(`disciplinas:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM disciplinas WHERE escola_id = ${escolaId}`;
        return rows as unknown as Disciplina[];
      }),
    ]);

    if (!turmaData) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
    }

    const escolaRows = await db`SELECT ano_letivo FROM escolas WHERE id = ${escolaId} LIMIT 1`;
    const anoLetivo = (escolaRows[0]?.ano_letivo as number | undefined) ?? new Date().getFullYear();

    const [notasB1, notasB2] = await Promise.all([
      cache.getOrSet(`notas:${escolaId}:bim:1:turma:${turmaId}`, async () => {
        const rows = await db`SELECT * FROM notas WHERE escola_id = ${escolaId} AND bimestre = 1 AND turma_id = ${turmaId}`;
        return rows as unknown as Nota[];
      }),
      cache.getOrSet(`notas:${escolaId}:bim:2:turma:${turmaId}`, async () => {
        const rows = await db`SELECT * FROM notas WHERE escola_id = ${escolaId} AND bimestre = 2 AND turma_id = ${turmaId}`;
        return rows as unknown as Nota[];
      }),
    ]);

    function buildSnapshot(notas: Nota[], bimestre: number) {
      const dashboard = buildSchoolDashboard({
        alunos,
        notas,
        turmas: [turmaData as Turma],
        disciplinas,
        bimestre,
        anoLetivo,
      });

      const mediasPorAluno = dashboard.mediasPorAluno
        .filter((item) => item.media !== null)
        .map((item) => ({
          alunoId: item.aluno.id,
          nome: item.aluno.nome,
          numeroChamada: item.aluno.numero_chamada,
          media: item.media as number,
        }));

      return {
        bimestre,
        temDados: notas.length > 0,
        mediaGeral: dashboard.mediaGeral,
        totalAlunos: dashboard.alunosAtivos.length,
        alunosCriticos: dashboard.alunosCriticos.length,
        percentualAdequado: dashboard.percentualAdequado,
        disciplinas: dashboard.disciplinasCriticasGeral.map((d) => ({
          id: d.disciplina.id,
          nome: d.disciplina.nome,
          percentualCritico: d.percentual,
          totalNotas: d.totalNotas ?? 0,
        })),
        mediasPorAluno,
      };
    }

    return NextResponse.json({
      turma: { id: turmaData.id, nome: turmaData.nome },
      b1: buildSnapshot(notasB1, 1),
      b2: buildSnapshot(notasB2, 2),
    });
  } catch (err) {
    console.error("[comparativo]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
