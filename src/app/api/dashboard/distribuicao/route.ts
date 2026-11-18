import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildDistribuicaoPedagogica } from "../../../../lib/analytics/buildDistribuicaoPedagogica";
import { cache } from "../../../../lib/cache";
import { resolveEscolaAccess, turmasVisiveis } from "../../../../lib/permissions";

import type {
  Aluno,
  Nota,
  Turma,
} from "../../../../lib/analytics/types";

function inteiroNoIntervalo(value: string | null, minimo: number, maximo: number): number | null {
  if (value === null) return null;
  const numero = Number(value);
  return Number.isInteger(numero) && numero >= minimo && numero <= maximo ? numero : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const escolaIdParam = searchParams.get("escolaId");

    if (!escolaIdParam) {
      return NextResponse.json({ error: "escolaId obrigatorio" }, { status: 400 });
    }

    const perfil = await checkApiAuth(request);
    if (!perfil) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const escolaId = resolveEscolaAccess(perfil, escolaIdParam);
    if (!escolaId) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const escolaRows = await db`
      SELECT ano_letivo, bimestre_atual FROM escolas WHERE id = ${escolaId} LIMIT 1
    `;
    const escola = escolaRows[0];
    if (!escola) {
      return NextResponse.json({ error: "Escola nao encontrada" }, { status: 404 });
    }

    const bimestreInformado = searchParams.get("bimestre");
    const anoInformado = searchParams.get("anoLetivo");
    const bimestre = bimestreInformado === null
      ? Number(escola.bimestre_atual ?? 1)
      : inteiroNoIntervalo(bimestreInformado, 1, 4);
    const anoLetivo = anoInformado === null
      ? Number(escola.ano_letivo ?? new Date().getFullYear())
      : inteiroNoIntervalo(anoInformado, 2000, 2100);

    if (bimestre === null || !Number.isInteger(bimestre) || bimestre < 1 || bimestre > 4) {
      return NextResponse.json({ error: "bimestre invalido" }, { status: 400 });
    }
    if (anoLetivo === null || !Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100) {
      return NextResponse.json({ error: "anoLetivo invalido" }, { status: 400 });
    }

    const turmasPermitidas = await turmasVisiveis(perfil, escolaId);
    const escopoKey = `${escolaId}:usuario:${perfil.id}:ano:${anoLetivo}:bim:${bimestre}`;

    const [turmas, alunos, notas] = await Promise.all([
      cache.getOrSet(`distribuicao:turmas:${escopoKey}`, async () => {
        const rows = await db`
          SELECT * FROM turmas
          WHERE escola_id = ${escolaId} AND id = ANY(${turmasPermitidas}::uuid[])
        `;
        return rows as unknown as Turma[];
      }),
      cache.getOrSet(`distribuicao:alunos:${escopoKey}`, async () => {
        const rows = await db`
          SELECT * FROM alunos
          WHERE escola_id = ${escolaId}
            AND ativo = true
            AND turma_id = ANY(${turmasPermitidas}::uuid[])
        `;
        return rows as unknown as Aluno[];
      }),
      cache.getOrSet(`distribuicao:notas:${escopoKey}`, async () => {
        const rows = await db`
          SELECT * FROM notas
          WHERE escola_id = ${escolaId}
            AND ano_letivo = ${anoLetivo}
            AND bimestre = ${bimestre}
            AND turma_id = ANY(${turmasPermitidas}::uuid[])
        `;
        return rows as unknown as Nota[];
      }),
    ]);

    const distribuicao = buildDistribuicaoPedagogica({ alunos, notas, turmas });

    return NextResponse.json({
      data: distribuicao,
      periodo: { anoLetivo, bimestre },
    });
  } catch (err) {
    console.error("[distribuicao]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
