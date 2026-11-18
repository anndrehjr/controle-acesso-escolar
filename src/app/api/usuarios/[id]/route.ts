import { NextResponse } from "next/server";
import { checkApiAuth, isDevMaster } from "../../../../lib/auth";
import { montarRegistroAuditoria } from "../../../../lib/audit";
import db from "../../../../lib/db";
import { capabilitiesFor, isRole, papeisAtribuiveisPor } from "../../../../types/roles";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await checkApiAuth(request);
  if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!capabilitiesFor(perfil.role).manageUsuarios) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { ativo?: boolean } | null;
  const novoAtivo = body?.ativo;
  if (typeof novoAtivo !== "boolean") {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  if (id === perfil.id && !novoAtivo) {
    return NextResponse.json({ error: "Você não pode desativar a própria conta" }, { status: 400 });
  }

  const rows = await db`
    SELECT id, nome, email, role, escola_id, ativo, is_dev_master
    FROM usuarios WHERE id=${id} LIMIT 1
  `;
  const alvo = rows[0];
  if (!alvo || !isRole(alvo.role)) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  if (alvo.is_dev_master) {
    return NextResponse.json({ error: "A conta Dev Master não pode ser desativada" }, { status: 403 });
  }

  const mesmoEscopo = capabilitiesFor(perfil.role).viewAllEscolas || perfil.escola_id === alvo.escola_id;
  const podeAdministrarPapel = isDevMaster(perfil) || papeisAtribuiveisPor(perfil.role).includes(alvo.role);
  if (!mesmoEscopo || !podeAdministrarPapel) {
    return NextResponse.json({ error: "Sem permissão para alterar este usuário" }, { status: 403 });
  }

  await db.begin(async (tx) => {
    const novos = { ...alvo, ativo: novoAtivo };
    const log = montarRegistroAuditoria({
      usuario: perfil, escolaId: alvo.escola_id, acao: novoAtivo ? "USUARIO_ATIVADO" : "USUARIO_DESATIVADO",
      tabela: "usuarios", registroId: id, tela: "/dashboard/usuarios", req: request,
      dadosAnteriores: alvo, dadosNovos: novos,
    });
    await tx`
      UPDATE usuarios
      SET ativo=${novoAtivo},
          session_version=session_version + CASE WHEN ativo<>${novoAtivo} THEN 1 ELSE 0 END
      WHERE id=${id}
    `;
    await tx`INSERT INTO logs_acesso ${tx([log], "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
  });

  return NextResponse.json({ ok: true, ativo: novoAtivo, sessoesRevogadas: !novoAtivo });
}
