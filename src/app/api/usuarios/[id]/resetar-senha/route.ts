import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { checkApiAuth } from "../../../../../lib/auth";
import db from "../../../../../lib/db";
import { capabilitiesFor, isRole } from "../../../../../types/roles";
import { registrarAuditoria } from "../../../../../lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await checkApiAuth(request);
  if (!perfil) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!capabilitiesFor(perfil.role).manageUsuarios) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { novaSenha?: string };
  const novaSenha = body.novaSenha;

  if (!novaSenha || novaSenha.length < 8) {
    return NextResponse.json({ error: "A nova senha precisa ter pelo menos 8 caracteres" }, { status: 400 });
  }

  const rows = await db`SELECT id, email, role, escola_id FROM usuarios WHERE id = ${id} LIMIT 1`;
  const alvo = rows[0];
  if (!alvo || !isRole(alvo.role)) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  // ADMIN_ESCOLA só reseta senha de usuários da própria escola, e nunca de um SUPER_ADMIN.
  const podeResetar =
    capabilitiesFor(perfil.role).viewAllEscolas ||
    (perfil.escola_id === alvo.escola_id && alvo.role !== "SUPER_ADMIN");

  if (!podeResetar) {
    return NextResponse.json({ error: "Sem permissão para redefinir a senha deste usuário" }, { status: 403 });
  }

  const hash = await bcrypt.hash(novaSenha, 12);
  await db`UPDATE usuarios SET senha_hash = ${hash} WHERE id = ${id}`;

  // Nunca logar a senha em si — só quem e quando.
  await registrarAuditoria({
    usuario: perfil,
    acao: "SENHA_REDEFINIDA",
    tela: "/dashboard/usuarios",
    req: request,
    dadosNovos: { usuarioAlvoId: id, usuarioAlvoEmail: alvo.email },
  });

  return NextResponse.json({ ok: true });
}
