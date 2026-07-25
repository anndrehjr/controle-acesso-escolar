import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import db from "../../../lib/db";
import { capabilitiesFor } from "../../../types/roles";

export async function GET(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!capabilitiesFor(perfil.role).viewAuditLogs) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limite = Math.min(Number(searchParams.get("limite") ?? "100"), 500);
  const usuarioEmail = searchParams.get("usuario");
  const acao = searchParams.get("acao");

  const rows = await db`
    SELECT id, usuario_email, role, escola_id, acao, tela, ip, user_agent, sucesso, created_at
    FROM logs_acesso
    WHERE (${usuarioEmail}::text IS NULL OR usuario_email ILIKE '%' || ${usuarioEmail} || '%')
      AND (${acao}::text IS NULL OR acao = ${acao})
    ORDER BY created_at DESC
    LIMIT ${limite}
  `;

  return NextResponse.json({ data: rows });
}
