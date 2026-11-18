import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import { montarRegistroAuditoria } from "../../../lib/audit";
import db from "../../../lib/db";
import { resolveEscolaAccess } from "../../../lib/permissions";
import { capabilitiesFor } from "../../../types/roles";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function autenticar(request: Request) {
  const perfil = await checkApiAuth(request);
  return perfil && capabilitiesFor(perfil.role).manageUsuarios ? perfil : null;
}

export async function GET(request: Request) {
  const perfil = await autenticar(request);
  if (!perfil) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const escolas = capabilitiesFor(perfil.role).viewAllEscolas
    ? await db`SELECT id, nome, ano_letivo FROM escolas WHERE ativo = true ORDER BY nome`
    : await db`SELECT id, nome, ano_letivo FROM escolas WHERE id = ${perfil.escola_id} AND ativo = true`;
  const escolaId = resolveEscolaAccess(perfil, searchParams.get("escolaId"));
  if (!escolaId) return NextResponse.json({ escolas, professores: [], turmas: [], disciplinas: [], vinculos: [] });

  const [professores, turmas, disciplinas, vinculos] = await Promise.all([
    db`SELECT id, nome, email FROM usuarios WHERE escola_id = ${escolaId} AND role = 'PROFESSOR' AND ativo = true ORDER BY nome`,
    db`SELECT id, nome, grupo_pedagogico FROM turmas WHERE escola_id = ${escolaId} AND ativo = true ORDER BY ano_serie, nome`,
    db`SELECT DISTINCT d.id, d.nome, md.etapa AS grupo_pedagogico FROM matriz_disciplinas md JOIN disciplinas d ON d.id = md.disciplina_id WHERE md.escola_id = ${escolaId} AND md.ativo = true AND d.ativo = true ORDER BY d.nome`,
    db`SELECT pv.id, pv.professor_id, u.nome AS professor_nome, pv.turma_id, t.nome AS turma_nome, pv.disciplina_id, d.nome AS disciplina_nome, pv.ativo FROM professor_vinculos pv JOIN usuarios u ON u.id = pv.professor_id JOIN turmas t ON t.id = pv.turma_id LEFT JOIN disciplinas d ON d.id = pv.disciplina_id WHERE pv.escola_id = ${escolaId} ORDER BY pv.ativo DESC, u.nome, t.nome, d.nome NULLS FIRST`,
  ]);
  return NextResponse.json({ escolaId, escolas, professores, turmas, disciplinas, vinculos });
}

export async function POST(request: Request) {
  const perfil = await autenticar(request);
  if (!perfil) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const escolaId = resolveEscolaAccess(perfil, typeof body?.escolaId === "string" ? body.escolaId : null);
  const professorId = typeof body?.professorId === "string" ? body.professorId : "";
  const turmaId = typeof body?.turmaId === "string" ? body.turmaId : "";
  const disciplinaId = typeof body?.disciplinaId === "string" && body.disciplinaId ? body.disciplinaId : null;
  if (!escolaId || !UUID.test(professorId) || !UUID.test(turmaId) || (disciplinaId && !UUID.test(disciplinaId))) {
    return NextResponse.json({ error: "Escola, professor, turma ou disciplina inválidos" }, { status: 400 });
  }

  try {
    const id = await db.begin(async (tx) => {
      const [professor, turma] = await Promise.all([
        tx`SELECT id FROM usuarios WHERE id = ${professorId} AND escola_id = ${escolaId} AND role = 'PROFESSOR' AND ativo = true`,
        tx`SELECT id FROM turmas WHERE id = ${turmaId} AND escola_id = ${escolaId} AND ativo = true`,
      ]);
      if (!professor[0]) throw new Error("PROFESSOR_INVALIDO");
      if (!turma[0]) throw new Error("TURMA_INVALIDA");

      const rows = disciplinaId
        ? await tx<{ id: string }[]>`
            INSERT INTO professor_vinculos (professor_id, escola_id, turma_id, disciplina_id, ativo)
            VALUES (${professorId}, ${escolaId}, ${turmaId}, ${disciplinaId}, true)
            ON CONFLICT (professor_id, escola_id, turma_id, disciplina_id)
              WHERE disciplina_id IS NOT NULL
            DO UPDATE SET ativo = true
            RETURNING id
          `
        : await tx<{ id: string }[]>`
            INSERT INTO professor_vinculos (professor_id, escola_id, turma_id, disciplina_id, ativo)
            VALUES (${professorId}, ${escolaId}, ${turmaId}, NULL, true)
            ON CONFLICT (professor_id, escola_id, turma_id)
              WHERE disciplina_id IS NULL
            DO UPDATE SET ativo = true
            RETURNING id
          `;
      const log = montarRegistroAuditoria({
        usuario: perfil,
        escolaId,
        acao: "PROFESSOR_VINCULADO",
        tabela: "professor_vinculos",
        registroId: rows[0].id,
        tela: "/dashboard/vinculos-professores",
        req: request,
        dadosNovos: { professorId, turmaId, disciplinaId, abrangencia: disciplinaId ? "DISCIPLINA" : "TURMA_COMPLETA" },
      });
      await tx`INSERT INTO logs_acesso ${tx([log], "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
      return rows[0].id;
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PROFESSOR_INVALIDO") return NextResponse.json({ error: "Professor inválido" }, { status: 400 });
    if (message === "TURMA_INVALIDA") return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
    if (message.includes("disciplina") || message.includes("matriz")) return NextResponse.json({ error: "A disciplina não pertence à matriz da turma" }, { status: 400 });
    console.error("[professor-vinculos] falha ao criar:", error);
    return NextResponse.json({ error: "Não foi possível criar o vínculo" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const perfil = await autenticar(request);
  if (!perfil) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const escolaId = resolveEscolaAccess(perfil, typeof body?.escolaId === "string" ? body.escolaId : null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!escolaId || !UUID.test(id)) return NextResponse.json({ error: "Vínculo inválido" }, { status: 400 });

  try {
    await db.begin(async (tx) => {
      const rows = await tx<{ id: string; professor_id: string; turma_id: string; disciplina_id: string | null; ativo: boolean }[]>`
        SELECT id, professor_id, turma_id, disciplina_id, ativo
        FROM professor_vinculos
        WHERE id = ${id} AND escola_id = ${escolaId}
        FOR UPDATE
      `;
      if (!rows[0]) throw new Error("VINCULO_INVALIDO");
      await tx`UPDATE professor_vinculos SET ativo = false WHERE id = ${id}`;
      const log = montarRegistroAuditoria({
        usuario: perfil,
        escolaId,
        acao: "PROFESSOR_DESVINCULADO",
        tabela: "professor_vinculos",
        registroId: id,
        tela: "/dashboard/vinculos-professores",
        req: request,
        dadosAnteriores: rows[0],
        dadosNovos: { ativo: false },
      });
      await tx`INSERT INTO logs_acesso ${tx([log], "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "VINCULO_INVALIDO") {
      return NextResponse.json({ error: "Vínculo não encontrado" }, { status: 404 });
    }
    console.error("[professor-vinculos] falha ao desativar:", error);
    return NextResponse.json({ error: "Não foi possível remover o vínculo" }, { status: 500 });
  }
}
