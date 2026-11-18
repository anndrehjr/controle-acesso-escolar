import { NextResponse } from "next/server";
import { checkApiAuth, isDevMaster } from "../../../lib/auth";
import { montarRegistroAuditoria } from "../../../lib/audit";
import { componentesPadrao } from "../../../lib/caderno-dev";
import db from "../../../lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function opcoes(escolaIdInformada: string | null, turmaIdInformada: string | null) {
  const escolas = await db<{ id: string; nome: string; anoLetivo: number; bimestreAtual: number }[]>`
    SELECT id,nome,ano_letivo AS "anoLetivo",bimestre_atual AS "bimestreAtual"
    FROM escolas WHERE ativo=true ORDER BY nome
  `;
  const escolaId = escolaIdInformada && UUID.test(escolaIdInformada) ? escolaIdInformada : escolas[0]?.id ?? "";
  const escola = escolas.find((item) => item.id === escolaId);
  if (!escola) throw new Error("ESCOLA_INVALIDA");
  const turmas = await db<{ id: string; nome: string; etapa: string; anoSerie: number; ordem: number }[]>`
    SELECT id,nome,etapa,ano_serie AS "anoSerie",
      (CASE WHEN etapa='EF' THEN ano_serie ELSE ano_serie+9 END)::int AS ordem
    FROM turmas WHERE escola_id=${escolaId} AND ativo=true ORDER BY ordem,nome
  `;
  const turmaId = turmaIdInformada && turmas.some((item) => item.id === turmaIdInformada)
    ? turmaIdInformada : turmas[0]?.id ?? "";
  const disciplinas = turmaId ? await db<{ id: string; nome: string; codigo: string }[]>`
    SELECT d.id,d.nome,COALESCE(md.codigo,d.codigo) AS codigo
    FROM turmas t
    JOIN matriz_disciplinas md ON md.escola_id=t.escola_id AND md.etapa=t.grupo_pedagogico AND md.ativo=true
    JOIN disciplinas d ON d.id=md.disciplina_id AND d.ativo=true
    WHERE t.id=${turmaId} AND t.escola_id=${escolaId} AND t.ativo=true
    ORDER BY md.codigo,d.nome
  ` : [];
  return { escolas, escolaId, escolaNome: escola.nome, anoLetivo: escola.anoLetivo, bimestreAtual: escola.bimestreAtual, turmas, turmaId, disciplinas };
}

async function contextoValido(escolaId: string, turmaId: string, disciplinaId: string) {
  const rows = await db`
    SELECT t.id FROM turmas t
    JOIN matriz_disciplinas md ON md.escola_id=t.escola_id AND md.etapa=t.grupo_pedagogico AND md.ativo=true
    JOIN disciplinas d ON d.id=md.disciplina_id AND d.ativo=true
    WHERE t.id=${turmaId} AND t.escola_id=${escolaId} AND t.ativo=true AND d.id=${disciplinaId}
    LIMIT 1
  `;
  return Boolean(rows[0]);
}

export async function GET(request: Request) {
  try {
    const perfil = await checkApiAuth(request);
    if (!isDevMaster(perfil)) return NextResponse.json({ error: "Recurso exclusivo do Dev Master" }, { status: 403 });
    const dev = perfil!;
    const { searchParams } = new URL(request.url);
    const dadosOpcoes = await opcoes(searchParams.get("escolaId"), searchParams.get("turmaId"));
    if (searchParams.get("opcoes") === "1") return NextResponse.json({ data: dadosOpcoes });

    const escolaId = dadosOpcoes.escolaId;
    const turmaId = searchParams.get("turmaId") ?? "";
    const disciplinaId = searchParams.get("disciplinaId") ?? "";
    const anoLetivo = Number(searchParams.get("anoLetivo") || dadosOpcoes.anoLetivo);
    const bimestre = Number(searchParams.get("bimestre") || dadosOpcoes.bimestreAtual || 4);
    if (!UUID.test(turmaId) || !UUID.test(disciplinaId) || !Number.isInteger(anoLetivo)
        || anoLetivo < 2000 || anoLetivo > 2100 || ![1,2,3,4].includes(bimestre)
        || !(await contextoValido(escolaId, turmaId, disciplinaId))) {
      return NextResponse.json({ error: "Selecione turma, disciplina, ano e bimestre válidos" }, { status: 400 });
    }
    const disciplina = dadosOpcoes.disciplinas.find((item) => item.id === disciplinaId)!;
    const turma = dadosOpcoes.turmas.find((item) => item.id === turmaId)!;
    const alunos = await db<{ matriculaId: string; alunoId: string; nome: string; numeroChamada: number }[]>`
      SELECT m.id AS "matriculaId",a.id AS "alunoId",a.nome,m.numero_chamada AS "numeroChamada"
      FROM matriculas m JOIN alunos a ON a.id=m.aluno_id AND a.ativo=true
      WHERE m.escola_id=${escolaId} AND m.turma_id=${turmaId} AND m.ano_letivo=${anoLetivo} AND m.status='ATIVA'
      ORDER BY m.numero_chamada,a.nome
    `;
    const cadernos = await db<{ id: string; updatedAt: string }[]>`
      SELECT id,updated_at AS "updatedAt" FROM dev_cadernos_notas
      WHERE created_by=${dev.id} AND escola_id=${escolaId} AND turma_id=${turmaId}
        AND disciplina_id=${disciplinaId} AND ano_letivo=${anoLetivo} AND bimestre=${bimestre}
      LIMIT 1
    `;
    const caderno = cadernos[0];
    let componentes: Array<{ id: string; nome: string; peso: number | null; notaMaxima: number; ordem: number }>;
    let resultados: Array<{ matriculaId: string; componenteId: string; nota: number }> = [];
    if (caderno) {
      componentes = await db`
        SELECT id,nome,peso::float AS peso,nota_maxima::float AS "notaMaxima",ordem
        FROM dev_caderno_componentes WHERE caderno_id=${caderno.id} ORDER BY ordem
      ` as typeof componentes;
      resultados = await db`
        SELECT matricula_id AS "matriculaId",componente_id AS "componenteId",nota::float AS nota
        FROM dev_caderno_resultados WHERE caderno_id=${caderno.id}
      ` as typeof resultados;
    } else {
      componentes = componentesPadrao(disciplina.nome).map((item, indice) => ({ id: `novo-${indice + 1}`, ...item, ordem: indice + 1 }));
    }
    return NextResponse.json({ data: {
      ...dadosOpcoes, turmaId, turmaNome: turma.nome, disciplinaId, disciplinaNome: disciplina.nome,
      codigoCurricular: disciplina.codigo, anoLetivo, bimestre, cadernoId: caderno?.id ?? null,
      atualizadoEm: caderno?.updatedAt ?? null, componentes, alunos, resultados,
    } });
  } catch (error) {
    console.error("[caderno-dev] GET:", error);
    return NextResponse.json({ error: "Não foi possível carregar o caderno de notas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const perfil = await checkApiAuth(request);
    if (!isDevMaster(perfil)) return NextResponse.json({ error: "Recurso exclusivo do Dev Master" }, { status: 403 });
    const dev = perfil!;
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const escolaId = typeof body.escolaId === "string" ? body.escolaId : "";
    const turmaId = typeof body.turmaId === "string" ? body.turmaId : "";
    const disciplinaId = typeof body.disciplinaId === "string" ? body.disciplinaId : "";
    const anoLetivo = Number(body.anoLetivo);
    const bimestre = Number(body.bimestre);
    if (![escolaId,turmaId,disciplinaId].every((id) => UUID.test(id)) || !Number.isInteger(anoLetivo)
        || anoLetivo < 2000 || anoLetivo > 2100 || ![1,2,3,4].includes(bimestre)
        || !(await contextoValido(escolaId,turmaId,disciplinaId))) {
      return NextResponse.json({ error: "Contexto do caderno inválido" }, { status: 400 });
    }
    const brutos = Array.isArray(body.componentes) ? body.componentes : [];
    if (brutos.length < 1 || brutos.length > 12) return NextResponse.json({ error: "Use entre 1 e 12 colunas de atividade" }, { status: 400 });
    const componentes = brutos.map((bruto, indice) => {
      const item = bruto as Record<string, unknown>;
      const nome = typeof item.nome === "string" ? item.nome.trim().slice(0,60) : "";
      const peso = item.peso === null || item.peso === "" || item.peso === undefined ? null : Number(item.peso);
      const notaMaxima = Number(item.notaMaxima ?? 10);
      if (!nome || (peso !== null && (!Number.isFinite(peso) || peso <= 0 || peso > 100))
          || !Number.isFinite(notaMaxima) || notaMaxima <= 0 || notaMaxima > 100) throw new Error(`COMPONENTE_${indice + 1}`);
      return { nome, peso, notaMaxima, ordem: indice + 1 };
    });
    const linhas = Array.isArray(body.notas) ? body.notas : [];
    if (linhas.length > 500) return NextResponse.json({ error: "Quantidade de alunos inválida" }, { status: 400 });
    const matriculaIds = [...new Set(linhas.map((linha) => String((linha as Record<string,unknown>).matriculaId ?? "")))];
    if (matriculaIds.some((id) => !UUID.test(id))) return NextResponse.json({ error: "Existe uma matrícula inválida" }, { status: 400 });
    const matriculas = matriculaIds.length ? await db<{ id: string }[]>`
      SELECT id FROM matriculas WHERE id=ANY(${matriculaIds}::uuid[]) AND escola_id=${escolaId}
        AND turma_id=${turmaId} AND ano_letivo=${anoLetivo} AND status='ATIVA'
    ` : [];
    if (matriculas.length !== matriculaIds.length) return NextResponse.json({ error: "Existe aluno inativo ou fora da turma" }, { status: 400 });

    const resultado = await db.begin(async (tx) => {
      const encontrados = await tx<{ id: string }[]>`
        SELECT id FROM dev_cadernos_notas WHERE created_by=${dev.id} AND turma_id=${turmaId}
          AND disciplina_id=${disciplinaId} AND ano_letivo=${anoLetivo} AND bimestre=${bimestre} FOR UPDATE
      `;
      const cadernoId = encontrados[0]?.id ?? (await tx<{ id: string }[]>`
        INSERT INTO dev_cadernos_notas (escola_id,turma_id,disciplina_id,ano_letivo,bimestre,created_by)
        VALUES (${escolaId},${turmaId},${disciplinaId},${anoLetivo},${bimestre},${dev.id}) RETURNING id
      `)[0].id;
      if (encontrados[0]) await tx`UPDATE dev_cadernos_notas SET updated_at=now() WHERE id=${cadernoId}`;
      await tx`DELETE FROM dev_caderno_componentes WHERE caderno_id=${cadernoId}`;
      const componentesSalvos: Array<{ id: string; notaMaxima: number }> = [];
      for (const componente of componentes) {
        const inseridos = await tx<{ id: string; notaMaxima: number }[]>`
          INSERT INTO dev_caderno_componentes (caderno_id,nome,ordem,peso,nota_maxima)
          VALUES (${cadernoId},${componente.nome},${componente.ordem},${componente.peso},${componente.notaMaxima})
          RETURNING id,nota_maxima::float AS "notaMaxima"
        `;
        componentesSalvos.push(inseridos[0]);
      }
      const resultados: Array<{ caderno_id: string; componente_id: string; matricula_id: string; nota: number }> = [];
      for (const linhaBruta of linhas) {
        const linha = linhaBruta as Record<string,unknown>;
        const valores = Array.isArray(linha.valores) ? linha.valores : [];
        valores.forEach((valor, indice) => {
          if (valor === null || valor === "" || valor === undefined) return;
          const nota = Number(valor);
          const componente = componentesSalvos[indice];
          if (!componente || !Number.isFinite(nota) || nota < 0 || nota > componente.notaMaxima) throw new Error("NOTA_INVALIDA");
          resultados.push({ caderno_id: cadernoId, componente_id: componente.id, matricula_id: String(linha.matriculaId), nota });
        });
      }
      if (resultados.length) await tx`INSERT INTO dev_caderno_resultados ${tx(resultados,"caderno_id","componente_id","matricula_id","nota")}`;
      const log = montarRegistroAuditoria({ usuario: dev, escolaId, acao: encontrados[0] ? "CADERNO_DEV_ATUALIZADO" : "CADERNO_DEV_CRIADO",
        tabela: "dev_cadernos_notas", registroId: cadernoId, tela: "/dashboard/caderno-notas", req: request,
        dadosNovos: { turmaId,disciplinaId,anoLetivo,bimestre,componentes: componentes.length,resultados: resultados.length } });
      await tx`INSERT INTO logs_acesso ${tx([log],"usuario_id","usuario_email","role","escola_id","acao","tabela","registro_id","tela","ip","user_agent","dados_anteriores","dados_novos","sucesso")}`;
      return { cadernoId, componentes: componentes.length, resultados: resultados.length };
    });
    return NextResponse.json({ ok: true, resumo: resultado });
  } catch (error) {
    const codigo = error instanceof Error ? error.message : "";
    if (codigo.startsWith("COMPONENTE_")) return NextResponse.json({ error: `A coluna ${codigo.split("_")[1]} está inválida` }, { status: 400 });
    if (codigo === "NOTA_INVALIDA") return NextResponse.json({ error: "Existe uma nota fora do intervalo permitido" }, { status: 400 });
    console.error("[caderno-dev] POST:", error);
    return NextResponse.json({ error: "Não foi possível salvar o caderno. Nenhuma alteração foi aplicada" }, { status: 500 });
  }
}
