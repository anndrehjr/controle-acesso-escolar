import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildDistribuicaoPedagogica } from "../../../../lib/analytics/buildDistribuicaoPedagogica";
import { cache } from "../../../../lib/cache";

import type {
  Aluno,
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

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const perfil = await verifyToken(token);
    if (!perfil) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    if (!perfil.id) {
      return NextResponse.json({ error: "Perfil inválido" }, { status: 401 });
    }

    const podeAcessar =
      perfil.role === "SUPER_ADMIN" ||
      (perfil.role === "ADMIN_ESCOLA" && perfil.escola_id === escolaId);

    if (!podeAcessar) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const [turmas, alunos] = await Promise.all([
      cache.getOrSet(`turmas:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM turmas WHERE escola_id = ${escolaId}`;
        return rows as unknown as Turma[];
      }),
      cache.getOrSet(`alunos:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND ativo = true`;
        return rows as unknown as Aluno[];
      }),
    ]);

    const notas = await cache.getOrSet(`notas:${escolaId}`, async () => {
      const rows = await db`SELECT * FROM notas WHERE escola_id = ${escolaId}`;
      return rows as unknown as Nota[];
    });

    const distribuicao = buildDistribuicaoPedagogica({ alunos, notas, turmas });

    return NextResponse.json({ data: distribuicao });
  } catch (err) {
    console.error("[distribuicao]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
