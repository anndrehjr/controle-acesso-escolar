import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import { montarRegistroAuditoria } from "../../../../lib/audit";
import { cache } from "../../../../lib/cache";
import db from "../../../../lib/db";
import { capabilitiesFor } from "../../../../types/roles";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await checkApiAuth(request);
  if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!capabilitiesFor(perfil.role).manageUsuarios) {
    return NextResponse.json({ error: "Sem permissão para retirar alunos" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null) as { tipo?: unknown; motivo?: unknown } | null;
  const tipo = body?.tipo === "TRANSFERENCIA" ? "TRANSFERENCIA" : body?.tipo === "INATIVACAO" ? "INATIVACAO" : null;
  const motivo = typeof body?.motivo === "string" ? body.motivo.trim().slice(0, 300) : "";
  if (!tipo) return NextResponse.json({ error: "Tipo de saída inválido" }, { status: 400 });
  if (motivo.length < 3) return NextResponse.json({ error: "Informe o motivo da saída" }, { status: 400 });

  try {
    const resultado = await db.begin(async (tx) => {
      const [aluno] = await tx`
        SELECT a.id, a.nome, a.escola_id, a.turma_id, a.numero_chamada, a.status, a.ativo,
               e.ano_letivo, t.nome AS turma_nome
        FROM alunos a
        JOIN escolas e ON e.id=a.escola_id
        JOIN turmas t ON t.id=a.turma_id
        WHERE a.id=${id}
        FOR UPDATE OF a
      `;
      if (!aluno) throw new Error("NAO_ENCONTRADO");
      if (!capabilitiesFor(perfil.role).viewAllEscolas && perfil.escola_id !== aluno.escola_id) {
        throw new Error("SEM_PERMISSAO");
      }
      const [matricula] = await tx`
        SELECT id, status, data_inicio FROM matriculas
        WHERE aluno_id=${id} AND escola_id=${aluno.escola_id}
          AND ano_letivo=${aluno.ano_letivo} AND status='ATIVA'
        FOR UPDATE
      `;
      if (!matricula) throw new Error("SEM_MATRICULA_ATIVA");

      const novoStatusMatricula = tipo === "TRANSFERENCIA" ? "TRANSFERIDA" : "CANCELADA";
      await tx`
        UPDATE matriculas
        SET status=${novoStatusMatricula}, data_fim=CURRENT_DATE, motivo_fim=${motivo}, updated_at=now()
        WHERE id=${matricula.id}
      `;
      const log = montarRegistroAuditoria({
        usuario: perfil, escolaId: aluno.escola_id as string,
        acao: tipo === "TRANSFERENCIA" ? "ALUNO_TRANSFERIDO" : "ALUNO_INATIVADO",
        tabela: "alunos", registroId: id, tela: "/dashboard/alunos", req: request,
        dadosAnteriores: { aluno, matricula },
        dadosNovos: { status: tipo === "TRANSFERENCIA" ? "TRANSFERIDO" : "INATIVO", ativo: false, motivo, dataFim: new Date().toISOString().slice(0, 10) },
      });
      await tx`INSERT INTO logs_acesso ${tx([log], "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
      return { id, nome: aluno.nome, tipo };
    });
    cache.invalidateAll();
    return NextResponse.json({ ok: true, aluno: resultado });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const respostas: Record<string, [string, number]> = {
      NAO_ENCONTRADO: ["Aluno não encontrado", 404],
      SEM_PERMISSAO: ["Sem permissão para alterar este aluno", 403],
      SEM_MATRICULA_ATIVA: ["O aluno não possui matrícula ativa no ano letivo atual", 409],
    };
    if (respostas[code]) return NextResponse.json({ error: respostas[code][0] }, { status: respostas[code][1] });
    console.error("[alunos] falha ao registrar saída:", error);
    return NextResponse.json({ error: "Não foi possível registrar a saída do aluno" }, { status: 500 });
  }
}
