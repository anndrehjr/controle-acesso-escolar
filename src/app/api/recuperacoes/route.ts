import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import { montarRegistroAuditoria } from "../../../lib/audit";
import { CRITERIOS_RECUPERACAO, TIPOS_RECUPERACAO } from "../../../lib/avaliacoes";
import { cache } from "../../../lib/cache";
import db from "../../../lib/db";
import { podeLancarDisciplina, podeVerTurma, resolveEscolaAccess } from "../../../lib/permissions";
import { capabilitiesFor } from "../../../types/roles";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function contexto(request: Request, body: Record<string, unknown>) {
  const perfil = await checkApiAuth(request);
  if (!perfil || !capabilitiesFor(perfil.role).manageNotas) return { erro: "Sem permissão", status: 403 } as const;
  const escolaId = resolveEscolaAccess(perfil, typeof body.escolaId === "string" ? body.escolaId : null);
  const turmaId = typeof body.turmaId === "string" ? body.turmaId : "";
  const disciplinaId = typeof body.disciplinaId === "string" ? body.disciplinaId : "";
  const anoLetivo = Number(body.anoLetivo);
  const bimestre = Number(body.bimestre);
  if (!escolaId || !UUID.test(turmaId) || !UUID.test(disciplinaId)
      || !Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100
      || ![1, 2, 3, 4].includes(bimestre)) {
    return { erro: "Contexto de recuperação inválido", status: 400 } as const;
  }
  if (!(await podeVerTurma(perfil, escolaId, turmaId))
      || !(await podeLancarDisciplina(perfil, escolaId, turmaId, disciplinaId))) {
    return { erro: "Sem permissão para a turma ou disciplina", status: 403 } as const;
  }
  return { perfil, escolaId, turmaId, disciplinaId, anoLetivo, bimestre } as const;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const body = Object.fromEntries(params.entries());
  const ctx = await contexto(request, body);
  if ("erro" in ctx) return NextResponse.json({ error: ctx.erro }, { status: ctx.status });
  const recuperacoes = await db`
    SELECT id, matricula_id, tipo, criterio, nota_anterior, nota_recuperacao,
           nota_final, observacao, aplicado, created_at, updated_at
    FROM recuperacoes
    WHERE escola_id = ${ctx.escolaId} AND turma_id = ${ctx.turmaId}
      AND disciplina_id = ${ctx.disciplinaId} AND ano_letivo = ${ctx.anoLetivo}
      AND bimestre = ${ctx.bimestre}
    ORDER BY updated_at DESC
  `;
  return NextResponse.json({ recuperacoes });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  const ctx = await contexto(request, body);
  if ("erro" in ctx) return NextResponse.json({ error: ctx.erro }, { status: ctx.status });

  const tipo = typeof body.tipo === "string" ? body.tipo : "BIMESTRAL";
  const criterio = typeof body.criterio === "string" ? body.criterio : "MAIOR_NOTA";
  const recebidas = Array.isArray(body.recuperacoes) ? body.recuperacoes : [];
  if (!TIPOS_RECUPERACAO.includes(tipo as (typeof TIPOS_RECUPERACAO)[number])
      || !CRITERIOS_RECUPERACAO.includes(criterio as (typeof CRITERIOS_RECUPERACAO)[number])
      || recebidas.length === 0 || recebidas.length > 300) {
    return NextResponse.json({ error: "Tipo, critério ou lote de recuperação inválido" }, { status: 400 });
  }

  const itens: Array<{ matriculaId: string; notaRecuperacao: number; observacao: string | null }> = [];
  const vistas = new Set<string>();
  for (const [indice, bruto] of recebidas.entries()) {
    const item = bruto as Record<string, unknown>;
    const matriculaId = typeof item.matriculaId === "string" ? item.matriculaId : "";
    const notaRecuperacao = Number(item.notaRecuperacao);
    const observacao = typeof item.observacao === "string" && item.observacao.trim() ? item.observacao.trim().slice(0, 500) : null;
    if (!UUID.test(matriculaId) || vistas.has(matriculaId)
        || !Number.isFinite(notaRecuperacao) || notaRecuperacao < 0 || notaRecuperacao > 10) {
      return NextResponse.json({ error: `Recuperação ${indice + 1} inválida ou repetida` }, { status: 400 });
    }
    vistas.add(matriculaId);
    itens.push({ matriculaId, notaRecuperacao, observacao });
  }

  try {
    const resumo = await db.begin(async (tx) => {
      const matriculaIds = itens.map((item) => item.matriculaId);
      const matriculas = await tx<{ id: string; aluno_id: string }[]>`
        SELECT id, aluno_id FROM matriculas
        WHERE id = ANY(${matriculaIds}::uuid[]) AND escola_id = ${ctx.escolaId}
          AND turma_id = ${ctx.turmaId} AND ano_letivo = ${ctx.anoLetivo}
          AND status = 'ATIVA'
        FOR UPDATE
      `;
      if (matriculas.length !== matriculaIds.length) throw new Error("MATRICULA_INVALIDA");
      const notas = await tx<{ id: string; matricula_id: string; nota: string | number; status: string; origem_calculo: string }[]>`
        SELECT id, matricula_id, nota, status, origem_calculo
        FROM notas
        WHERE matricula_id = ANY(${matriculaIds}::uuid[])
          AND disciplina_id = ${ctx.disciplinaId}
          AND ano_letivo = ${ctx.anoLetivo} AND bimestre = ${ctx.bimestre}
        FOR UPDATE
      `;
      if (notas.length !== matriculaIds.length) throw new Error("NOTA_INEXISTENTE");
      const anteriores = await tx<{ id: string; matricula_id: string; tipo: string; criterio: string; nota_anterior: string | number; nota_recuperacao: string | number; nota_final: string | number; observacao: string | null; aplicado: boolean }[]>`
        SELECT id, matricula_id, tipo, criterio, nota_anterior, nota_recuperacao, nota_final, observacao, aplicado
        FROM recuperacoes
        WHERE matricula_id = ANY(${matriculaIds}::uuid[]) AND disciplina_id = ${ctx.disciplinaId}
          AND ano_letivo = ${ctx.anoLetivo} AND bimestre = ${ctx.bimestre} AND tipo = ${tipo}
        FOR UPDATE
      `;
      const notasPorMatricula = new Map(notas.map((nota) => [nota.matricula_id, nota]));
      const anterioresPorMatricula = new Map(anteriores.map((item) => [item.matricula_id, item]));
      const linhas = itens.map((item) => ({
        escola_id: ctx.escolaId, turma_id: ctx.turmaId, matricula_id: item.matriculaId,
        disciplina_id: ctx.disciplinaId, ano_letivo: ctx.anoLetivo, bimestre: ctx.bimestre,
        tipo, criterio,
        nota_anterior: Number(anterioresPorMatricula.get(item.matriculaId)?.nota_anterior ?? notasPorMatricula.get(item.matriculaId)!.nota),
        nota_recuperacao: item.notaRecuperacao,
        nota_final: item.notaRecuperacao,
        observacao: item.observacao, aplicado: true, created_by: ctx.perfil.id,
      }));
      const gravadas = await tx`
        INSERT INTO recuperacoes ${tx(linhas, "escola_id", "turma_id", "matricula_id", "disciplina_id", "ano_letivo", "bimestre", "tipo", "criterio", "nota_anterior", "nota_recuperacao", "nota_final", "observacao", "aplicado", "created_by")}
        ON CONFLICT (matricula_id, disciplina_id, ano_letivo, bimestre, tipo) DO UPDATE SET
          criterio = EXCLUDED.criterio, nota_anterior = EXCLUDED.nota_anterior,
          nota_recuperacao = EXCLUDED.nota_recuperacao, nota_final = EXCLUDED.nota_final,
          observacao = EXCLUDED.observacao, aplicado = true, created_by = EXCLUDED.created_by,
          updated_at = now()
        RETURNING id, matricula_id, tipo, criterio, nota_anterior, nota_recuperacao, nota_final, observacao, aplicado
      ` as unknown as Array<{ id: string; matricula_id: string; tipo: string; criterio: string; nota_anterior: string | number; nota_recuperacao: string | number; nota_final: string | number; observacao: string | null; aplicado: boolean }>;

      for (const recuperacao of gravadas) {
        await tx`
          UPDATE notas SET nota = ${Number(recuperacao.nota_final)}, status = 'RECUPERACAO',
            origem_calculo = 'RECUPERACAO', updated_at = now()
          WHERE id = ${notasPorMatricula.get(recuperacao.matricula_id)!.id}
        `;
      }

      const logs = gravadas.flatMap((item) => {
        const notaAnterior = notasPorMatricula.get(item.matricula_id)!;
        return [
          montarRegistroAuditoria({
            usuario: ctx.perfil, escolaId: ctx.escolaId,
            acao: anterioresPorMatricula.has(item.matricula_id) ? "RECUPERACAO_EDITADA" : "RECUPERACAO_APLICADA",
            tabela: "recuperacoes", registroId: item.id, tela: "/dashboard/avaliacoes", req: request,
            dadosAnteriores: anterioresPorMatricula.get(item.matricula_id) ?? undefined,
            dadosNovos: item,
          }),
          montarRegistroAuditoria({
            usuario: ctx.perfil, escolaId: ctx.escolaId, acao: "NOTA_ATUALIZADA_RECUPERACAO",
            tabela: "notas", registroId: notaAnterior.id, tela: "/dashboard/avaliacoes", req: request,
            dadosAnteriores: notaAnterior,
            dadosNovos: { nota: Number(item.nota_final), status: "RECUPERACAO", origem_calculo: "RECUPERACAO", recuperacaoId: item.id },
          }),
        ];
      });
      await tx`INSERT INTO logs_acesso ${tx(logs, "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
      return { recuperacoes: gravadas.length };
    });
    cache.invalidateAll();
    return NextResponse.json({ ok: true, resumo });
  } catch (error) {
    const codigo = error instanceof Error ? error.message : "";
    if (codigo === "MATRICULA_INVALIDA") return NextResponse.json({ error: "Uma matrícula está inativa ou fora da turma. Nenhum dado foi alterado" }, { status: 400 });
    if (codigo === "NOTA_INEXISTENTE") return NextResponse.json({ error: "A recuperação exige uma nota bimestral anterior para todos os alunos. Nenhum dado foi alterado" }, { status: 400 });
    console.error("[recuperacoes] falha ao aplicar:", error);
    return NextResponse.json({ error: "Não foi possível aplicar a recuperação. Nenhum dado foi alterado" }, { status: 500 });
  }
}
