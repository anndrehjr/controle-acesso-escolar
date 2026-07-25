import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import db from "../../../lib/db";
import { capabilitiesFor } from "../../../types/roles";
import { registrarAuditoria } from "../../../lib/audit";

export async function GET(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!capabilitiesFor(perfil.role).manageUsuarios) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const rows = capabilitiesFor(perfil.role).viewAllEscolas
    ? await db`SELECT id, nome, email, role, escola_id, ativo FROM usuarios ORDER BY nome`
    : await db`
        SELECT id, nome, email, role, escola_id, ativo FROM usuarios
        WHERE escola_id = ${perfil.escola_id} ORDER BY nome
      `;

  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!capabilitiesFor(perfil.role).manageUsuarios) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = (await request.json()) as {
    nome?: string;
    email?: string;
    role?: string;
    escolaId?: string;
  };

  const { nome, email, role, escolaId } = body;

  if (!nome?.trim() || !email?.trim() || !role) {
    return NextResponse.json({ error: "Nome, e-mail e papel são obrigatórios" }, { status: 400 });
  }

  // ADMIN_ESCOLA só cria usuários na própria escola, e nunca SUPER_ADMIN.
  const escolaFinal = capabilitiesFor(perfil.role).viewAllEscolas ? (escolaId ?? null) : perfil.escola_id;

  if (role === "SUPER_ADMIN" && perfil.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Sem permissão para criar este papel" }, { status: 403 });
  }
  if (!capabilitiesFor(perfil.role).viewAllEscolas && !escolaFinal) {
    return NextResponse.json({ error: "Escola obrigatória" }, { status: 400 });
  }

  const existe = await db`SELECT 1 FROM usuarios WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
  if (existe.length > 0) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  const [novo] = await db`
    INSERT INTO usuarios (nome, email, role, escola_id, ativo)
    VALUES (${nome.trim()}, ${email.toLowerCase().trim()}, ${role}, ${escolaFinal}, true)
    RETURNING id
  `;

  await registrarAuditoria({
    usuario: perfil,
    acao: "USUARIO_CRIADO",
    tela: "/dashboard/usuarios",
    req: request,
    dadosNovos: { id: novo.id, nome, email, role, escolaId: escolaFinal },
  });

  return NextResponse.json({ id: novo.id }, { status: 201 });
}
