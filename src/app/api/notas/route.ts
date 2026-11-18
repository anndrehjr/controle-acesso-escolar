import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import db from "../../../lib/db";
import { cache } from "../../../lib/cache";
import { capabilitiesFor } from "../../../types/roles";
import {
  disciplinasVisiveisNaTurma,
  podeVerTurma,
  resolveEscolaAccess,
} from "../../../lib/permissions";
import { montarRegistroAuditoria } from "../../../lib/audit";
import { validarLoteNotas } from "../../../lib/notas-batch";

const BIMESTRES_VALIDOS = [1, 2, 3, 4];

export async function GET(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const escolaId = resolveEscolaAccess(perfil, searchParams.get("escolaId"));
  if (!escolaId) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const turmaId = searchParams.get("turmaId");
  if (!turmaId || !(await podeVerTurma(perfil, escolaId, turmaId))) {
    return NextResponse.json({ error: "Sem permissão para esta turma" }, { status: 403 });
  }

  const bimestre = Number(searchParams.get("bimestre") ?? "1");
  const anoLetivo = Number(searchParams.get("anoLetivo") ?? new Date().getFullYear());
  if (!BIMESTRES_VALIDOS.includes(bimestre) || !Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100) {
    return NextResponse.json({ error: "Bimestre ou ano letivo inválido" }, { status: 400 });
  }

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? "50")));
  const offset = (page - 1) * pageSize;
  const disciplinasPermitidas = await disciplinasVisiveisNaTurma(perfil, escolaId, turmaId);
  if (disciplinasPermitidas?.length === 0) {
    return NextResponse.json({ data: [], pagination: { page, pageSize, total: 0, totalPages: 1 } });
  }

  const filtroDisciplinas = disciplinasPermitidas === null
    ? db``
    : db`AND n.disciplina_id = ANY(${disciplinasPermitidas}::uuid[])`;
  const [rows, totalRows] = await Promise.all([
    db`
      SELECT n.id, n.aluno_id, a.nome AS aluno_nome, m.numero_chamada,
             n.disciplina_id, d.nome AS disciplina_nome, n.bimestre, n.ano_letivo, n.nota
      FROM notas n
      JOIN matriculas m ON m.id = n.matricula_id
      JOIN alunos a ON a.id = n.aluno_id
      JOIN disciplinas d ON d.id = n.disciplina_id
      WHERE n.escola_id = ${escolaId} AND n.turma_id = ${turmaId}
        AND n.bimestre = ${bimestre} AND n.ano_letivo = ${anoLetivo}
        ${filtroDisciplinas}
      ORDER BY m.numero_chamada, d.nome
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    db`
      SELECT count(*)::int AS total FROM notas n
      WHERE n.escola_id = ${escolaId} AND n.turma_id = ${turmaId}
        AND n.bimestre = ${bimestre} AND n.ano_letivo = ${anoLetivo}
        ${filtroDisciplinas}
    `,
  ]);

  const total = totalRows[0]?.total ?? 0;
  return NextResponse.json({
    data: rows,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
}

export async function POST(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!capabilitiesFor(perfil.role).manageNotas) {
    return NextResponse.json({ error: "Sem permissão para lançar notas" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { escolaId?: unknown; notas?: unknown } | null;
  const escolaIdPedido = typeof body?.escolaId === "string" ? body.escolaId : null;
  const escolaId = resolveEscolaAccess(perfil, escolaIdPedido);
  if (!escolaId) return NextResponse.json({ error: "Sem permissão para esta escola" }, { status: 403 });

  const validacao = validarLoteNotas(body?.notas);
  if (!validacao.ok) return NextResponse.json({ error: validacao.erro }, { status: 400 });
  const itens = validacao.itens;

  const turmas = [...new Set(itens.map((item) => item.turmaId))];
  const disciplinasPorTurma = new Map<string, string[] | null>();
  for (const turmaId of turmas) {
    if (!(await podeVerTurma(perfil, escolaId, turmaId))) {
      return NextResponse.json({ error: "Sem permissão para uma das turmas do lote" }, { status: 403 });
    }
    disciplinasPorTurma.set(turmaId, await disciplinasVisiveisNaTurma(perfil, escolaId, turmaId));
  }
  if (itens.some((item) => {
    const permitidas = disciplinasPorTurma.get(item.turmaId);
    return permitidas !== null && !permitidas?.includes(item.disciplinaId);
  })) {
    return NextResponse.json({ error: "Sem permissão para uma das disciplinas do lote" }, { status: 403 });
  }

  const alunoIds = [...new Set(itens.map((item) => item.alunoId))];
  const disciplinaIds = [...new Set(itens.map((item) => item.disciplinaId))];
  const anos = [...new Set(itens.map((item) => item.anoLetivo))];
  const bimestres = [...new Set(itens.map((item) => item.bimestre))];
  const batchId = randomUUID();

  try {
    await db.begin(async (tx) => {
      const [turmasBanco, matriculas, matrizes, notasAtuais] = await Promise.all([
        tx<{ id: string; grupo_pedagogico: string }[]>`
          SELECT id, grupo_pedagogico FROM turmas
          WHERE escola_id = ${escolaId} AND id = ANY(${turmas}::uuid[]) AND ativo = true
        `,
        tx<{ id: string; aluno_id: string; turma_id: string; ano_letivo: number; aluno_nome: string }[]>`
          SELECT m.id, m.aluno_id, m.turma_id, m.ano_letivo, a.nome AS aluno_nome
          FROM matriculas m JOIN alunos a ON a.id = m.aluno_id
          WHERE m.escola_id = ${escolaId}
            AND m.aluno_id = ANY(${alunoIds}::uuid[])
            AND m.turma_id = ANY(${turmas}::uuid[])
            AND m.ano_letivo = ANY(${anos}::int[])
            AND m.status = 'ATIVA'
          FOR UPDATE OF m
        `,
        tx<{ grupo_pedagogico: string; disciplina_id: string; disciplina_nome: string }[]>`
          SELECT md.etapa AS grupo_pedagogico, md.disciplina_id, d.nome AS disciplina_nome
          FROM matriz_disciplinas md JOIN disciplinas d ON d.id = md.disciplina_id
          WHERE md.escola_id = ${escolaId}
            AND md.disciplina_id = ANY(${disciplinaIds}::uuid[])
            AND md.ativo = true AND d.ativo = true
        `,
        tx<{ id: string; aluno_id: string; disciplina_id: string; bimestre: number; ano_letivo: number; nota: string | number }[]>`
          SELECT id, aluno_id, disciplina_id, bimestre, ano_letivo, nota
          FROM notas
          WHERE escola_id = ${escolaId}
            AND aluno_id = ANY(${alunoIds}::uuid[])
            AND disciplina_id = ANY(${disciplinaIds}::uuid[])
            AND ano_letivo = ANY(${anos}::int[])
            AND bimestre = ANY(${bimestres}::int[])
          FOR UPDATE
        `,
      ]);

      if (turmasBanco.length !== turmas.length) throw new Error("TURMA_INVALIDA");
      const grupos = new Map(turmasBanco.map((turma) => [turma.id, turma.grupo_pedagogico]));
      const matriculasPorChave = new Map(matriculas.map((matricula) => [
        `${matricula.aluno_id}:${matricula.turma_id}:${matricula.ano_letivo}`,
        matricula,
      ]));
      const matrizesPorChave = new Map(matrizes.map((item) => [
        `${item.grupo_pedagogico}:${item.disciplina_id}`,
        item,
      ]));
      const notasPorChave = new Map(notasAtuais.map((nota) => [
        `${nota.aluno_id}:${nota.disciplina_id}:${nota.bimestre}:${nota.ano_letivo}`,
        nota,
      ]));

      for (const item of itens) {
        if (!matriculasPorChave.has(`${item.alunoId}:${item.turmaId}:${item.anoLetivo}`)) {
          throw new Error("MATRICULA_INVALIDA");
        }
        if (!matrizesPorChave.has(`${grupos.get(item.turmaId)}:${item.disciplinaId}`)) {
          throw new Error("DISCIPLINA_INVALIDA");
        }
      }

      const linhas = itens.map((item) => ({
        escola_id: escolaId,
        turma_id: item.turmaId,
        aluno_id: item.alunoId,
        matricula_id: matriculasPorChave.get(`${item.alunoId}:${item.turmaId}:${item.anoLetivo}`)!.id,
        disciplina_id: item.disciplinaId,
        ano_letivo: item.anoLetivo,
        bimestre: item.bimestre,
        nota: item.nota,
        status: "NORMAL",
        origem_calculo: "LANCAMENTO_MANUAL",
      }));
      const gravadas = await tx`
        INSERT INTO notas ${tx(linhas, "escola_id", "turma_id", "aluno_id", "matricula_id", "disciplina_id", "ano_letivo", "bimestre", "nota", "status", "origem_calculo")}
        ON CONFLICT (aluno_id, disciplina_id, bimestre, ano_letivo) DO UPDATE SET
          escola_id = EXCLUDED.escola_id,
          turma_id = EXCLUDED.turma_id,
          matricula_id = EXCLUDED.matricula_id,
          nota = EXCLUDED.nota,
          status = EXCLUDED.status,
          origem_calculo = EXCLUDED.origem_calculo,
          updated_at = now()
        RETURNING id, aluno_id, disciplina_id, bimestre, ano_letivo
      ` as unknown as Array<{ id: string; aluno_id: string; disciplina_id: string; bimestre: number; ano_letivo: number }>;
      const ids = new Map<string, string>(gravadas.map((nota) => [
        `${nota.aluno_id}:${nota.disciplina_id}:${nota.bimestre}:${nota.ano_letivo}`,
        nota.id,
      ]));
      const logs = itens.map((item) => {
        const key = `${item.alunoId}:${item.disciplinaId}:${item.bimestre}:${item.anoLetivo}`;
        const anterior = notasPorChave.get(key);
        const matricula = matriculasPorChave.get(`${item.alunoId}:${item.turmaId}:${item.anoLetivo}`)!;
        const disciplina = matrizesPorChave.get(`${grupos.get(item.turmaId)}:${item.disciplinaId}`)!;
        return montarRegistroAuditoria({
          usuario: perfil,
          escolaId,
          acao: anterior ? "NOTA_EDITADA" : "NOTA_LANCADA",
          tabela: "notas",
          registroId: ids.get(key),
          tela: "/dashboard/diario",
          req: request,
          dadosAnteriores: anterior ? { nota: Number(anterior.nota) } : undefined,
          dadosNovos: {
            batchId,
            alunoId: item.alunoId,
            alunoNome: matricula.aluno_nome,
            matriculaId: matricula.id,
            disciplinaId: item.disciplinaId,
            disciplinaNome: disciplina.disciplina_nome,
            turmaId: item.turmaId,
            bimestre: item.bimestre,
            anoLetivo: item.anoLetivo,
            nota: item.nota,
          },
        });
      });
      await tx`
        INSERT INTO logs_acesso ${tx(logs,
          "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id",
          "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}
      `;
    });

    cache.invalidateAll();
    return NextResponse.json({
      ok: true,
      batchId,
      resultados: itens.map((item) => ({
        alunoId: item.alunoId,
        disciplinaId: item.disciplinaId,
        bimestre: item.bimestre,
        ok: true,
      })),
      resumo: { total: itens.length, sucesso: itens.length, falhas: 0 },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const mensagens: Record<string, string> = {
      TURMA_INVALIDA: "Uma das turmas é inválida ou está inativa",
      MATRICULA_INVALIDA: "Um dos alunos não possui matrícula ativa na turma e no ano informados",
      DISCIPLINA_INVALIDA: "Uma das disciplinas não pertence à matriz da turma",
    };
    if (mensagens[code]) return NextResponse.json({ error: `${mensagens[code]}. Nenhuma nota foi alterada` }, { status: 400 });
    console.error("[notas] falha no lote atômico:", error);
    return NextResponse.json({ error: "Não foi possível salvar o lote. Nenhuma nota foi alterada" }, { status: 500 });
  }
}

