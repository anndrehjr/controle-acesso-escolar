import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildHeatmapPedagogico } from "../../../../lib/analytics/buildHeatmapPedagogico";
import { cache } from "../../../../lib/cache";

import type {
  Aluno,
  Disciplina,
  MatrizDisciplina,
  Nota,
  Turma,
} from "../../../../lib/analytics/types";

const ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

export async function GET(request: Request) {
  try {
    if (!(await checkApiAuth(request))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bimestre = Number(searchParams.get("bimestre") ?? "1");
    const turmaId = searchParams.get("turma");

    const turmasKey = turmaId ? `turmas:${ESCOLA_ID}:${turmaId}` : `turmas:${ESCOLA_ID}`;
    const alunosKey = turmaId ? `alunos:${ESCOLA_ID}:turma:${turmaId}` : `alunos:${ESCOLA_ID}`;

    const [turmas, alunos, disciplinas, matriz] = await Promise.all([
      cache.getOrSet(turmasKey, async () => {
        const rows = turmaId
          ? await db`SELECT * FROM turmas WHERE escola_id = ${ESCOLA_ID} AND id = ${turmaId} ORDER BY ano_serie ASC`
          : await db`SELECT * FROM turmas WHERE escola_id = ${ESCOLA_ID} ORDER BY ano_serie ASC`;
        return rows as unknown as Turma[];
      }),
      cache.getOrSet(alunosKey, async () => {
        const rows = turmaId
          ? await db`SELECT * FROM alunos WHERE escola_id = ${ESCOLA_ID} AND ativo = true AND turma_id = ${turmaId}`
          : await db`SELECT * FROM alunos WHERE escola_id = ${ESCOLA_ID} AND ativo = true`;
        return rows as unknown as Aluno[];
      }),
      cache.getOrSet(`disciplinas:${ESCOLA_ID}`, async () => {
        const rows = await db`SELECT * FROM disciplinas WHERE escola_id = ${ESCOLA_ID}`;
        return rows as unknown as Disciplina[];
      }),
      cache.getOrSet(`matriz:${ESCOLA_ID}`, async () => {
        const rows = await db`SELECT * FROM matriz_disciplinas WHERE escola_id = ${ESCOLA_ID}`;
        return rows as unknown as MatrizDisciplina[];
      }),
    ]);

    const notas = await cache.getOrSet(
      `notas:${ESCOLA_ID}:bim:${bimestre}`,
      async () => {
        const rows = await db`SELECT * FROM notas WHERE escola_id = ${ESCOLA_ID} AND bimestre = ${bimestre}`;
        return rows as unknown as Nota[];
      }
    );

    const heatmap = buildHeatmapPedagogico({
      alunos,
      notas,
      turmas,
      disciplinas,
      matriz,
    });

    return NextResponse.json({ data: heatmap });
  } catch (err) {
    console.error("[heatmap]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
