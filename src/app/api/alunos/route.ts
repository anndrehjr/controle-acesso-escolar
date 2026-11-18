import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import { montarRegistroAuditoria } from "../../../lib/audit";
import { cache } from "../../../lib/cache";
import db from "../../../lib/db";
import { resolveEscolaAccess } from "../../../lib/permissions";
import { capabilitiesFor } from "../../../types/roles";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escolaPermitida(perfil: Awaited<ReturnType<typeof checkApiAuth>>, escolaIdPedido: unknown) {
  if (!perfil) return null;
  const pedido = typeof escolaIdPedido === "string" ? escolaIdPedido : null;
  return resolveEscolaAccess(perfil, pedido);
}

export async function GET(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!capabilitiesFor(perfil.role).manageUsuarios) {
    return NextResponse.json({ error: "Sem permissão para gerenciar alunos" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const escolaId = escolaPermitida(perfil, searchParams.get("escolaId"));
  if (!escolaId) return NextResponse.json({ error: "Sem permissão para esta escola" }, { status: 403 });

  const escolas = await db`
    SELECT id, nome, ano_letivo FROM escolas
    WHERE id=${escolaId} AND ativo=true LIMIT 1
  `;
  const escola = escolas[0];
  if (!escola) return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 });
  const anoLetivo = Number(escola.ano_letivo);

  const [turmas, alunos] = await Promise.all([
    db`
      SELECT id, nome, ano_serie FROM turmas
      WHERE escola_id=${escolaId} AND ativo=true
      ORDER BY ano_serie, nome
    `,
    db`
      SELECT a.id, a.nome, a.turma_id, a.numero_chamada, a.status, a.ativo,
             t.nome AS turma_nome,
             m.id AS matricula_id, m.ano_letivo, m.status AS matricula_status,
             m.data_inicio, m.data_fim, m.motivo_fim
      FROM alunos a
      JOIN turmas t ON t.id=a.turma_id
      LEFT JOIN LATERAL (
        SELECT id, ano_letivo, status, data_inicio, data_fim, motivo_fim
        FROM matriculas
        WHERE aluno_id=a.id AND ano_letivo=${anoLetivo}
        ORDER BY (status='ATIVA') DESC, updated_at DESC, created_at DESC
        LIMIT 1
      ) m ON true
      WHERE a.escola_id=${escolaId}
      ORDER BY t.ano_serie, t.nome, a.numero_chamada, a.nome
    `,
  ]);

  return NextResponse.json({ escola, anoLetivo, turmas, alunos });
}

export async function POST(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!capabilitiesFor(perfil.role).manageUsuarios) {
    return NextResponse.json({ error: "Sem permissão para cadastrar alunos" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    escolaId?: unknown;
    nome?: unknown;
    turmaId?: unknown;
    numeroChamada?: unknown;
    anoLetivo?: unknown;
  } | null;
  const escolaId = escolaPermitida(perfil, body?.escolaId);
  const nome = typeof body?.nome === "string" ? body.nome.trim().replace(/\s+/g, " ") : "";
  const turmaId = typeof body?.turmaId === "string" ? body.turmaId : "";
  const numeroChamada = Number(body?.numeroChamada);
  const anoLetivo = Number(body?.anoLetivo);

  if (!escolaId) return NextResponse.json({ error: "Sem permissão para esta escola" }, { status: 403 });
  if (nome.length < 3 || nome.length > 160) {
    return NextResponse.json({ error: "Informe o nome completo do aluno" }, { status: 400 });
  }
  if (!UUID.test(turmaId)) return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
  if (!Number.isInteger(numeroChamada) || numeroChamada < 1 || numeroChamada > 999) {
    return NextResponse.json({ error: "Número de chamada inválido" }, { status: 400 });
  }
  if (!Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100) {
    return NextResponse.json({ error: "Ano letivo inválido" }, { status: 400 });
  }

  try {
    const novo = await db.begin(async (tx) => {
      const [escola] = await tx`
        SELECT id, ano_letivo FROM escolas
        WHERE id=${escolaId} AND ativo=true FOR UPDATE
      `;
      if (!escola || Number(escola.ano_letivo) !== anoLetivo) throw new Error("ANO_INVALIDO");
      const [turma] = await tx`
        SELECT id, nome FROM turmas
        WHERE id=${turmaId} AND escola_id=${escolaId} AND ativo=true
      `;
      if (!turma) throw new Error("TURMA_INVALIDA");

      const chamadaOcupada = await tx`
        SELECT 1 FROM matriculas
        WHERE turma_id=${turmaId} AND ano_letivo=${anoLetivo}
          AND numero_chamada=${numeroChamada} AND status='ATIVA'
        LIMIT 1
      `;
      if (chamadaOcupada.length > 0) throw new Error("CHAMADA_OCUPADA");

      const [aluno] = await tx`
        INSERT INTO alunos (escola_id, turma_id, nome, numero_chamada, status, ativo)
        VALUES (${escolaId}, ${turmaId}, ${nome}, ${numeroChamada}, 'ATIVO', true)
        RETURNING id, nome, turma_id, numero_chamada, status, ativo
      `;
      const [matricula] = await tx`
        INSERT INTO matriculas (escola_id, aluno_id, turma_id, ano_letivo, numero_chamada, status)
        VALUES (${escolaId}, ${aluno.id}, ${turmaId}, ${anoLetivo}, ${numeroChamada}, 'ATIVA')
        RETURNING id, ano_letivo, status, data_inicio
      `;
      const log = montarRegistroAuditoria({
        usuario: perfil, escolaId, acao: "ALUNO_CADASTRADO", tabela: "alunos",
        registroId: aluno.id as string, tela: "/dashboard/alunos", req: request,
        dadosNovos: { ...aluno, matriculaId: matricula.id, anoLetivo, turmaNome: turma.nome },
      });
      await tx`INSERT INTO logs_acesso ${tx([log], "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
      return { ...aluno, matricula_id: matricula.id, ano_letivo: anoLetivo, turma_nome: turma.nome };
    });
    cache.invalidateAll();
    return NextResponse.json({ aluno: novo }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const mensagens: Record<string, string> = {
      ANO_INVALIDO: "O ano letivo informado não é o ano atual da escola",
      TURMA_INVALIDA: "Turma inválida ou inativa",
      CHAMADA_OCUPADA: "Esse número de chamada já está sendo usado por outro aluno da turma",
    };
    if (mensagens[code]) return NextResponse.json({ error: mensagens[code] }, { status: 409 });
    const banco = error as { code?: string; constraint_name?: string };
    if (banco.code === "23505") {
      return NextResponse.json({ error: "Já existe uma matrícula ativa com esses dados" }, { status: 409 });
    }
    console.error("[alunos] falha ao cadastrar:", error);
    return NextResponse.json({ error: "Não foi possível cadastrar o aluno" }, { status: 500 });
  }
}
