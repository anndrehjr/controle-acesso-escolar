import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildHeatmapPedagogico } from "../../../../lib/analytics/buildHeatmapPedagogico";
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

    const todasNotas = await cache.getOrSet(
      `notas:${escolaId}:bim:${bimestre}`,
      async () => {
        const rows = await db`SELECT * FROM notas WHERE escola_id = ${escolaId} AND bimestre = ${bimestre}`;
        return rows as unknown as Nota[];
      }
    );

    const turmas = turmasPermitidas ? turmasBrutas.filter((t) => turmasPermitidas.includes(t.id)) : turmasBrutas;
    const alunos = turmasPermitidas
      ? alunosBrutos.filter((a) => turmasPermitidas.includes(a.turma_id as string))
      : alunosBrutos;
    const notas = turmasPermitidas
      ? todasNotas.filter((n) => turmasPermitidas.includes(n.turma_id as string))
      : todasNotas;

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
