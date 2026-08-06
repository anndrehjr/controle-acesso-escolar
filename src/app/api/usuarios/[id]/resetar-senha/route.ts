import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { checkApiAuth, isDevMaster } from "../../../../../lib/auth";
import db from "../../../../../lib/db";
import { capabilitiesFor, isRole } from "../../../../../types/roles";
import { registrarAuditoria } from "../../../../../lib/audit";
import { verificarLimiteAcao, registrarAcao, ipDaRequisicao } from "../../../../../lib/rateLimit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await checkApiAuth(request);
  if (!perfil) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!capabilitiesFor(perfil.role).manageUsuarios) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Limite de ações (F-06 da auditoria): no máximo 5 resets em 15 min por conta admin (e-mail
  // de quem está agindo) ou por IP — TODA tentativa conta, não só falha, já que o risco aqui é
  // uma conta admin comprometida resetando senhas em sequência, não alguém "adivinhando".
  const ip = ipDaRequisicao(request);
  const limite = await verificarLimiteAcao(perfil.email, ip);
  if (limite.bloqueado) {
    await registrarAuditoria({
      usuario: perfil,
      acao: "RESET_SENHA_BLOQUEADO",
      tela: "/dashboard/usuarios",
      req: request,
      sucesso: false,
    });
    return NextResponse.json(
      { error: `Muitos resets de senha em pouco tempo. Tente novamente em ${limite.minutosParaLiberar} minutos.` },
      { status: 429 }
    );
  }
  await registrarAcao(perfil.email, ip);

  const { id } = await params;
  const body = (await request.json()) as { novaSenha?: string };
  const novaSenha = body.novaSenha;

  if (!novaSenha || novaSenha.length < 8) {
    return NextResponse.json({ error: "A nova senha precisa ter pelo menos 8 caracteres" }, { status: 400 });
  }

  const rows = await db`SELECT id, email, role, escola_id, is_dev_master FROM usuarios WHERE id = ${id} LIMIT 1`;
  const alvo = rows[0];
  if (!alvo || !isRole(alvo.role)) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  // O Dev Master nunca pode ter a senha redefinida por outra pessoa (F-Final/4: "nunca poderá
  // perder permissões") — só ele mesmo, via /api/auth/trocar-senha.
  if (alvo.is_dev_master) {
    return NextResponse.json({ error: "A senha do Dev Master só pode ser trocada por ele mesmo" }, { status: 403 });
  }

  // ADMIN_ESCOLA (Direção/Coordenação) só reseta senha de usuários da própria escola, e nunca
  // de um Administrador Multi-Escolas (SUPER_ADMIN) ou Dev Master.
  const podeResetar =
    isDevMaster(perfil) ||
    capabilitiesFor(perfil.role).viewAllEscolas ||
    (perfil.escola_id === alvo.escola_id && alvo.role !== "SUPER_ADMIN" && alvo.role !== "DEV_MASTER");

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
