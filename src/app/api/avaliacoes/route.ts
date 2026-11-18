import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import { montarRegistroAuditoria } from "../../../lib/audit";
import { validarAvaliacao } from "../../../lib/avaliacoes";
import { cache } from "../../../lib/cache";
import db from "../../../lib/db";
import { podeLancarDisciplina, podeVerTurma, resolveEscolaAccess } from "../../../lib/permissions";
import { capabilitiesFor } from "../../../types/roles";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function autenticarContexto(
  request: Request,
  entrada: { escolaId?: unknown; turmaId?: unknown; disciplinaId?: unknown; anoLetivo?: unknown; bimestre?: unknown },
) {
  const perfil = await checkApiAuth(request);
  if (!perfil || !capabilitiesFor(perfil.role).manageNotas) return { erro: "Sem permissão", status: 403 } as const;
  const escolaId = resolveEscolaAccess(perfil, typeof entrada.escolaId === "string" ? entrada.escolaId : null);
  const turmaId = typeof entrada.turmaId === "string" ? entrada.turmaId : "";
  const disciplinaId = typeof entrada.disciplinaId === "string" ? entrada.disciplinaId : "";
  const anoLetivo = Number(entrada.anoLetivo);
  const bimestre = Number(entrada.bimestre);
  if (!escolaId || !UUID.test(turmaId) || !UUID.test(disciplinaId)
      || !Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100
      || ![1, 2, 3, 4].includes(bimestre)) {
    return { erro: "Contexto de avaliação inválido", status: 400 } as const;
  }
  if (!(await podeVerTurma(perfil, escolaId, turmaId))
      || !(await podeLancarDisciplina(perfil, escolaId, turmaId, disciplinaId))) {
    return { erro: "Sem permissão para a turma ou disciplina", status: 403 } as const;
  }
  return { perfil, escolaId, turmaId, disciplinaId, anoLetivo, bimestre } as const;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contexto = await autenticarContexto(request, {
    escolaId: searchParams.get("escolaId"),
    turmaId: searchParams.get("turmaId"),
    disciplinaId: searchParams.get("disciplinaId"),
    anoLetivo: searchParams.get("anoLetivo"),
    bimestre: searchParams.get("bimestre"),
  });
  if ("erro" in contexto) return NextResponse.json({ error: contexto.erro }, { status: contexto.status });

  const avaliacoes = await db`
    SELECT av.id, av.nome, av.tipo, av.peso, av.nota_maxima, av.data_avaliacao, av.ativo,
           count(ra.id)::int AS resultados,
           round(avg((ra.nota / av.nota_maxima) * 10), 2) AS media_normalizada
    FROM avaliacoes av
    LEFT JOIN resultados_avaliacoes ra ON ra.avaliacao_id = av.id AND ra.ausente = false
    WHERE av.escola_id = ${contexto.escolaId}
      AND av.turma_id = ${contexto.turmaId}
      AND av.disciplina_id = ${contexto.disciplinaId}
      AND av.ano_letivo = ${contexto.anoLetivo}
      AND av.bimestre = ${contexto.bimestre}
    GROUP BY av.id
    ORDER BY av.ativo DESC, av.data_avaliacao NULLS LAST, av.created_at
  `;

  const avaliacaoId = searchParams.get("avaliacaoId");
  let resultados: Array<Record<string, unknown>> = [];
  if (avaliacaoId && UUID.test(avaliacaoId) && avaliacoes.some((item) => item.id === avaliacaoId)) {
    resultados = await db`
      SELECT id, avaliacao_id, matricula_id, nota, ausente, observacao
      FROM resultados_avaliacoes
      WHERE avaliacao_id = ${avaliacaoId}
      ORDER BY matricula_id
    ` as unknown as Array<Record<string, unknown>>;
  }
  return NextResponse.json({ avaliacoes, resultados });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  const contexto = await autenticarContexto(request, body);
  if ("erro" in contexto) return NextResponse.json({ error: contexto.erro }, { status: contexto.status });
  const acao = body.acao === "SALVAR_RESULTADOS" ? "SALVAR_RESULTADOS" : "CRIAR_AVALIACAO";

  if (acao === "CRIAR_AVALIACAO") {
    const validacao = validarAvaliacao(body);
    if (!validacao.ok) return NextResponse.json({ error: validacao.erro }, { status: 400 });
    try {
      const criada = await db.begin(async (tx) => {
        const rows = await tx`
          INSERT INTO avaliacoes (
            escola_id, turma_id, disciplina_id, ano_letivo, bimestre,
            nome, tipo, peso, nota_maxima, data_avaliacao, created_by
          ) VALUES (
            ${contexto.escolaId}, ${contexto.turmaId}, ${contexto.disciplinaId},
            ${contexto.anoLetivo}, ${contexto.bimestre}, ${validacao.avaliacao.nome},
            ${validacao.avaliacao.tipo}, ${validacao.avaliacao.peso},
            ${validacao.avaliacao.notaMaxima}, ${validacao.avaliacao.dataAvaliacao},
            ${contexto.perfil.id}
          )
          RETURNING id, nome, tipo, peso, nota_maxima, data_avaliacao, ativo
        `;
        const log = montarRegistroAuditoria({
          usuario: contexto.perfil, escolaId: contexto.escolaId, acao: "AVALIACAO_CRIADA",
          tabela: "avaliacoes", registroId: rows[0].id, tela: "/dashboard/avaliacoes",
          req: request, dadosNovos: rows[0],
        });
        await tx`INSERT INTO logs_acesso ${tx([log], "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
        return rows[0];
      });
      return NextResponse.json({ avaliacao: criada }, { status: 201 });
    } catch (error) {
      console.error("[avaliacoes] falha ao criar:", error);
      return NextResponse.json({ error: "Não foi possível criar a avaliação" }, { status: 500 });
    }
  }

  const avaliacaoId = typeof body.avaliacaoId === "string" ? body.avaliacaoId : "";
  const recebidos = Array.isArray(body.resultados) ? body.resultados : [];
  if (!UUID.test(avaliacaoId) || recebidos.length === 0 || recebidos.length > 300) {
    return NextResponse.json({ error: "Avaliação ou lote de resultados inválido" }, { status: 400 });
  }
  const resultados: Array<{ matriculaId: string; nota: number | null; ausente: boolean; observacao: string | null }> = [];
  const matriculasVistas = new Set<string>();
  for (const [indice, bruto] of recebidos.entries()) {
    const item = bruto as Record<string, unknown>;
    const matriculaId = typeof item.matriculaId === "string" ? item.matriculaId : "";
    const ausente = item.ausente === true;
    const nota = ausente ? null : Number(item.nota);
    const observacao = typeof item.observacao === "string" && item.observacao.trim() ? item.observacao.trim().slice(0, 500) : null;
    if (!UUID.test(matriculaId) || matriculasVistas.has(matriculaId)
        || (!ausente && (!Number.isFinite(nota) || (nota as number) < 0))) {
      return NextResponse.json({ error: `Resultado ${indice + 1} inválido ou repetido` }, { status: 400 });
    }
    matriculasVistas.add(matriculaId);
    resultados.push({ matriculaId, nota, ausente, observacao });
  }

  try {
    const resumo = await db.begin(async (tx) => {
      const avaliacoes = await tx<{ id: string; nota_maxima: string | number }[]>`
        SELECT id, nota_maxima FROM avaliacoes
        WHERE id = ${avaliacaoId} AND escola_id = ${contexto.escolaId}
          AND turma_id = ${contexto.turmaId} AND disciplina_id = ${contexto.disciplinaId}
          AND ano_letivo = ${contexto.anoLetivo} AND bimestre = ${contexto.bimestre}
          AND ativo = true
        FOR UPDATE
      `;
      if (!avaliacoes[0]) throw new Error("AVALIACAO_INVALIDA");
      const notaMaxima = Number(avaliacoes[0].nota_maxima);
      if (resultados.some((item) => item.nota !== null && item.nota > notaMaxima)) throw new Error("NOTA_ACIMA_MAXIMA");

      const matriculaIds = resultados.map((item) => item.matriculaId);
      const matriculas = await tx<{ id: string; aluno_id: string }[]>`
        SELECT id, aluno_id FROM matriculas
        WHERE id = ANY(${matriculaIds}::uuid[]) AND escola_id = ${contexto.escolaId}
          AND turma_id = ${contexto.turmaId} AND ano_letivo = ${contexto.anoLetivo}
          AND status = 'ATIVA'
        FOR UPDATE
      `;
      if (matriculas.length !== matriculaIds.length) throw new Error("MATRICULA_INVALIDA");
      const recuperacoes = await tx`
        SELECT id FROM recuperacoes
        WHERE matricula_id = ANY(${matriculaIds}::uuid[])
          AND disciplina_id = ${contexto.disciplinaId}
          AND ano_letivo = ${contexto.anoLetivo} AND bimestre = ${contexto.bimestre}
          AND aplicado = true
        LIMIT 1
      `;
      if (recuperacoes[0]) throw new Error("RECUPERACAO_EXISTENTE");

      const anteriores = await tx<{ id: string; avaliacao_id: string; matricula_id: string; nota: string | number | null; ausente: boolean; observacao: string | null }[]>`
        SELECT id, avaliacao_id, matricula_id, nota, ausente, observacao
        FROM resultados_avaliacoes
        WHERE avaliacao_id = ${avaliacaoId} AND matricula_id = ANY(${matriculaIds}::uuid[])
        FOR UPDATE
      `;
      const notasAnteriores = await tx<{ id: string; matricula_id: string; nota: string | number; status: string; origem_calculo: string }[]>`
        SELECT id, matricula_id, nota, status, origem_calculo
        FROM notas
        WHERE matricula_id = ANY(${matriculaIds}::uuid[])
          AND disciplina_id = ${contexto.disciplinaId}
          AND ano_letivo = ${contexto.anoLetivo} AND bimestre = ${contexto.bimestre}
        FOR UPDATE
      `;

      const linhas = resultados.map((item) => ({
        avaliacao_id: avaliacaoId,
        matricula_id: item.matriculaId,
        nota: item.nota,
        ausente: item.ausente,
        observacao: item.observacao,
      }));
      const gravados = await tx`
        INSERT INTO resultados_avaliacoes ${tx(linhas, "avaliacao_id", "matricula_id", "nota", "ausente", "observacao")}
        ON CONFLICT (avaliacao_id, matricula_id) DO UPDATE SET
          nota = EXCLUDED.nota, ausente = EXCLUDED.ausente,
          observacao = EXCLUDED.observacao, updated_at = now()
        RETURNING id, matricula_id, nota, ausente, observacao
      ` as unknown as Array<{ id: string; matricula_id: string; nota: string | number | null; ausente: boolean; observacao: string | null }>;

      const medias = await tx<{ matricula_id: string; nota: string | number }[]>`
        SELECT ra.matricula_id,
          round(sum((ra.nota / av.nota_maxima * 10) * av.peso) / sum(av.peso), 2) AS nota
        FROM resultados_avaliacoes ra
        JOIN avaliacoes av ON av.id = ra.avaliacao_id
        WHERE ra.matricula_id = ANY(${matriculaIds}::uuid[])
          AND av.escola_id = ${contexto.escolaId} AND av.turma_id = ${contexto.turmaId}
          AND av.disciplina_id = ${contexto.disciplinaId}
          AND av.ano_letivo = ${contexto.anoLetivo} AND av.bimestre = ${contexto.bimestre}
          AND av.ativo = true AND ra.ausente = false AND ra.nota IS NOT NULL
        GROUP BY ra.matricula_id
      `;
      const alunos = new Map(matriculas.map((item) => [item.id, item.aluno_id]));
      const linhasNotas = medias.map((media) => ({
        escola_id: contexto.escolaId, turma_id: contexto.turmaId,
        aluno_id: alunos.get(media.matricula_id)!, matricula_id: media.matricula_id,
        disciplina_id: contexto.disciplinaId, ano_letivo: contexto.anoLetivo,
        bimestre: contexto.bimestre, nota: Number(media.nota), status: "NORMAL",
        origem_calculo: "AVALIACOES",
      }));
      const notasGravadas = linhasNotas.length === 0 ? [] : await tx`
        INSERT INTO notas ${tx(linhasNotas, "escola_id", "turma_id", "aluno_id", "matricula_id", "disciplina_id", "ano_letivo", "bimestre", "nota", "status", "origem_calculo")}
        ON CONFLICT (aluno_id, disciplina_id, bimestre, ano_letivo) DO UPDATE SET
          escola_id = EXCLUDED.escola_id, turma_id = EXCLUDED.turma_id,
          matricula_id = EXCLUDED.matricula_id, nota = EXCLUDED.nota,
          status = EXCLUDED.status, origem_calculo = EXCLUDED.origem_calculo,
          updated_at = now()
        RETURNING id, matricula_id, nota, status, origem_calculo
      ` as unknown as Array<{ id: string; matricula_id: string; nota: string | number; status: string; origem_calculo: string }>;

      const anterioresResultado = new Map(anteriores.map((item) => [item.matricula_id, item]));
      const anterioresNota = new Map(notasAnteriores.map((item) => [item.matricula_id, item]));
      const logs = [
        ...gravados.map((item) => montarRegistroAuditoria({
          usuario: contexto.perfil, escolaId: contexto.escolaId,
          acao: anterioresResultado.has(item.matricula_id) ? "RESULTADO_AVALIACAO_EDITADO" : "RESULTADO_AVALIACAO_LANCADO",
          tabela: "resultados_avaliacoes", registroId: item.id, tela: "/dashboard/avaliacoes", req: request,
          dadosAnteriores: anterioresResultado.get(item.matricula_id) ?? undefined,
          dadosNovos: { avaliacaoId, ...item },
        })),
        ...notasGravadas.map((item) => montarRegistroAuditoria({
          usuario: contexto.perfil, escolaId: contexto.escolaId,
          acao: anterioresNota.has(item.matricula_id) ? "NOTA_RECALCULADA_AVALIACOES" : "NOTA_GERADA_AVALIACOES",
          tabela: "notas", registroId: item.id, tela: "/dashboard/avaliacoes", req: request,
          dadosAnteriores: anterioresNota.get(item.matricula_id) ?? undefined,
          dadosNovos: item,
        })),
      ];
      await tx`INSERT INTO logs_acesso ${tx(logs, "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
      return { resultados: gravados.length, notasRecalculadas: notasGravadas.length };
    });
    cache.invalidateAll();
    return NextResponse.json({ ok: true, resumo });
  } catch (error) {
    const codigo = error instanceof Error ? error.message : "";
    const mensagens: Record<string, string> = {
      AVALIACAO_INVALIDA: "Avaliação não encontrada ou inativa",
      NOTA_ACIMA_MAXIMA: "Existe resultado acima da nota máxima da avaliação",
      MATRICULA_INVALIDA: "Uma matrícula está inativa ou fora da turma",
      RECUPERACAO_EXISTENTE: "Já existe recuperação aplicada. Revise a recuperação antes de alterar avaliações",
    };
    if (mensagens[codigo]) return NextResponse.json({ error: `${mensagens[codigo]}. Nenhum resultado foi alterado` }, { status: 400 });
    console.error("[avaliacoes] falha ao salvar resultados:", error);
    return NextResponse.json({ error: "Não foi possível salvar os resultados. Nenhum dado foi alterado" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  const contexto = await autenticarContexto(request, body);
  if ("erro" in contexto) return NextResponse.json({ error: contexto.erro }, { status: contexto.status });
  const id = typeof body.id === "string" ? body.id : "";
  if (!UUID.test(id)) return NextResponse.json({ error: "Avaliação inválida" }, { status: 400 });
  try {
    await db.begin(async (tx) => {
      const rows = await tx`
        SELECT id, nome, tipo, peso, nota_maxima, data_avaliacao, ativo
        FROM avaliacoes
        WHERE id = ${id} AND escola_id = ${contexto.escolaId}
          AND turma_id = ${contexto.turmaId} AND disciplina_id = ${contexto.disciplinaId}
          AND ano_letivo = ${contexto.anoLetivo} AND bimestre = ${contexto.bimestre}
        FOR UPDATE
      `;
      if (!rows[0]) throw new Error("AVALIACAO_INVALIDA");
      await tx`UPDATE avaliacoes SET ativo = false, updated_at = now() WHERE id = ${id}`;
      const log = montarRegistroAuditoria({
        usuario: contexto.perfil, escolaId: contexto.escolaId, acao: "AVALIACAO_DESATIVADA",
        tabela: "avaliacoes", registroId: id, tela: "/dashboard/avaliacoes", req: request,
        dadosAnteriores: rows[0], dadosNovos: { ...rows[0], ativo: false },
      });
      await tx`INSERT INTO logs_acesso ${tx([log], "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "AVALIACAO_INVALIDA") {
      return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });
    }
    console.error("[avaliacoes] falha ao desativar:", error);
    return NextResponse.json({ error: "Não foi possível desativar a avaliação" }, { status: 500 });
  }
}
