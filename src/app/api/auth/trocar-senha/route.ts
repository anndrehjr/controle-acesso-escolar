import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { checkApiAuth, signToken, sessionMaxAgeSeconds } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { registrarAuditoria } from "../../../../lib/audit";

/**
 * Troca de senha pelo próprio usuário — diferente de
 * /api/usuarios/[id]/resetar-senha (que é um admin redefinindo a senha de
 * outra pessoa). Sempre exige a senha atual, mesmo na troca obrigatória do
 * primeiro login (a senha temporária gerada É a "senha atual" nesse caso).
 */
export async function POST(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { senhaAtual?: string; novaSenha?: string } | null;
  const senhaAtual = body?.senhaAtual;
  const novaSenha = body?.novaSenha;

  if (!senhaAtual || !novaSenha) {
    return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 });
  }
  if (novaSenha.length < 8) {
    return NextResponse.json({ error: "A nova senha precisa ter pelo menos 8 caracteres" }, { status: 400 });
  }
  if (novaSenha === senhaAtual) {
    return NextResponse.json({ error: "A nova senha precisa ser diferente da atual" }, { status: 400 });
  }

  const rows = await db`SELECT id, senha_hash FROM usuarios WHERE id = ${perfil.id} LIMIT 1`;
  const usuario = rows[0];
  if (!usuario || !usuario.senha_hash) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash as string);
  if (!senhaValida) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
  }

  const hash = await bcrypt.hash(novaSenha, 12);
  await db`
    UPDATE usuarios SET senha_hash = ${hash}, deve_trocar_senha = false WHERE id = ${perfil.id}
  `;

  await registrarAuditoria({
    usuario: perfil,
    acao: "SENHA_ALTERADA_PELO_PROPRIO_USUARIO",
    tela: "/trocar-senha",
    req: request,
  });

  // Reemite o token com deve_trocar_senha=false — sem isso o middleware continuaria
  // redirecionando pra /trocar-senha até a sessão expirar naturalmente.
  const novoPayload = { ...perfil, deve_trocar_senha: false };
  const lembrar = perfil.lembrar ?? false;
  const token = await signToken(novoPayload, { lembrarAcesso: lembrar });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sessionMaxAgeSeconds(lembrar),
    path: "/",
  });

  return response;
}
