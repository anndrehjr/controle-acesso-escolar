import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import db from "../../../lib/db";
import { capabilitiesFor } from "../../../types/roles";

const CHAVE_SENSIVEL = /senha|password|token|secret|hash/i;

function protegerSegredos(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(protegerSegredos);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([chave, conteudo]) => [
    chave,
    CHAVE_SENSIVEL.test(chave) ? "[PROTEGIDO]" : protegerSegredos(conteudo),
  ]));
}

export async function GET(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!capabilitiesFor(perfil.role).viewAuditLogs) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const solicitado = Number(searchParams.get("limite") ?? "100");
  const limite = Number.isFinite(solicitado) ? Math.min(500, Math.max(1, Math.trunc(solicitado))) : 100;
  const usuarioEmail = searchParams.get("usuario");
  const acao = searchParams.get("acao");
  const tabela = searchParams.get("tabela");

  const rows = await db`
    SELECT id, usuario_email, role, escola_id, acao, tabela, registro_id, tela,
           ip, user_agent, dados_anteriores, dados_novos, sucesso, created_at
    FROM logs_acesso
    WHERE (${usuarioEmail}::text IS NULL OR usuario_email ILIKE '%' || ${usuarioEmail} || '%')
      AND (${acao}::text IS NULL OR acao = ${acao})
      AND (${tabela}::text IS NULL OR tabela = ${tabela})
    ORDER BY created_at DESC
    LIMIT ${limite}
  `;

  return NextResponse.json({
    data: rows.map((row) => ({
      ...row,
      dados_anteriores: protegerSegredos(row.dados_anteriores),
      dados_novos: protegerSegredos(row.dados_novos),
    })),
  });
}
