import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import db from "../../../lib/db";
import { cache } from "../../../lib/cache";
import { capabilitiesFor, isRole, papeisAtribuiveisPor } from "../../../types/roles";
import { registrarAuditoria } from "../../../lib/audit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!capabilitiesFor(perfil.role).manageUsuarios) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Paginação (achado da auditoria — F-09): página 1-based, tamanho padrão generoso (100)
  // pra não mudar o comportamento de quem já chama sem parâmetro nenhum.
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? "100")));
  const offset = (page - 1) * pageSize;

  const escopo = capabilitiesFor(perfil.role).viewAllEscolas;

  const [rows, totalRows, escolas] = await Promise.all([
    escopo
      ? db`
          SELECT id, nome, email, role, escola_id, ativo FROM usuarios
          ORDER BY nome LIMIT ${pageSize} OFFSET ${offset}
        `
      : db`
          SELECT id, nome, email, role, escola_id, ativo FROM usuarios
          WHERE escola_id = ${perfil.escola_id}
          ORDER BY nome LIMIT ${pageSize} OFFSET ${offset}
        `,
    escopo
      ? db`SELECT count(*)::int AS total FROM usuarios`
      : db`SELECT count(*)::int AS total FROM usuarios WHERE escola_id = ${perfil.escola_id}`,
    escopo
      ? db`SELECT id, nome FROM escolas WHERE ativo = true ORDER BY nome`
      : Promise.resolve([]),
  ]);

  const total = totalRows[0]?.total ?? 0;

  return NextResponse.json({
    data: rows,
    escolas,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
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

  if (!isRole(role)) {
    return NextResponse.json({ error: "Papel inválido" }, { status: 400 });
  }
  // Dev Master nunca é criado por essa rota genérica — é um usuário exclusivo, provisionado
  // manualmente com fluxo próprio de senha temporária + troca obrigatória (F-Final/4 e /5).
  // Ninguém pode criar/atribuir esse papel, nem outro Dev Master.
  if (role === "DEV_MASTER") {
    return NextResponse.json({ error: "Este papel não pode ser criado por aqui" }, { status: 403 });
  }
  // Escalada de privilégio: só pode atribuir um papel que esteja na lista do que o
  // próprio perfil tem permissão de atribuir (nunca igual ou acima do seu nível).
  if (!papeisAtribuiveisPor(perfil.role).includes(role)) {
    return NextResponse.json({ error: "Sem permissão para atribuir este papel" }, { status: 403 });
  }
  // SUPER_ADMIN é global. Os demais papéis criados por esta rota pertencem sempre a uma
  // escola ativa; isso também impede que um administrador multi-escolas crie professores
  // sem escola, que depois não aparecem na tela de vínculos.
  const papelGlobal = role === "SUPER_ADMIN";
  const escolaFinal = papelGlobal
    ? null
    : capabilitiesFor(perfil.role).viewAllEscolas
      ? escolaId?.trim() || null
      : perfil.escola_id;

  if (!papelGlobal) {
    if (!escolaFinal || !UUID.test(escolaFinal)) {
      return NextResponse.json({ error: "Escola obrigatória" }, { status: 400 });
    }
    const escolaAtiva = await db`
      SELECT id FROM escolas WHERE id = ${escolaFinal} AND ativo = true LIMIT 1
    `;
    if (!escolaAtiva[0]) {
      return NextResponse.json({ error: "Escola inválida ou inativa" }, { status: 400 });
    }
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

  // Invalidação ativa de cache (achado da auditoria) — inofensivo hoje (esta listagem não é
  // cacheada), mas protege qualquer cache futuro de usuários sem precisar lembrar disso depois.
  cache.invalidate("usuarios:");

  return NextResponse.json({ id: novo.id }, { status: 201 });
}
