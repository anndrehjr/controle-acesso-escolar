import { NextResponse } from "next/server"
import { checkApiAuth, isDevMaster } from "../../../lib/auth"
import { calcularIndiceComposto } from "../../../lib/analytics/indiceComposto"
import { registrarAuditoria } from "../../../lib/audit"
import db from "../../../lib/db"
import {
  disciplinasVisiveisNaTurma,
  resolveEscolaAccess,
  turmasVisiveis,
} from "../../../lib/permissions"
import {
  gerarCsv,
  montarRelatorio,
  montarRelatorioIntervencao,
  TIPOS_RELATORIO,
  type RegistroRelatorio,
  type TipoRelatorio,
} from "../../../lib/relatorios"
import { capabilitiesFor } from "../../../types/roles"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STATUS = ["ATIVA", "TRANSFERIDA", "CONCLUIDA", "CANCELADA"]

function uuidOuNulo(valor: string | null): string | null {
  return valor && UUID.test(valor) ? valor : null
}

export async function GET(request: Request) {
  try {
    const perfil = await checkApiAuth(request)
    if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    const capacidades = capabilitiesFor(perfil.role)
    if (!capacidades.viewReports) {
      return NextResponse.json({ error: "Sem permissão para relatórios" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const escolas = capacidades.viewAllEscolas
      ? await db`SELECT id,nome,ano_letivo,bimestre_atual FROM escolas WHERE ativo=true ORDER BY nome`
      : await db`SELECT id,nome,ano_letivo,bimestre_atual FROM escolas WHERE id=${perfil.escola_id} AND ativo=true`
    const escolaId = resolveEscolaAccess(perfil, searchParams.get("escolaId"))
    if (!escolaId) {
      if (searchParams.get("opcoes") === "1") {
        return NextResponse.json({ escolas, escolaId: null, turmas: [], disciplinas: [], alunos: [] })
      }
      return NextResponse.json({ error: "Selecione uma escola" }, { status: 400 })
    }
    const escola = escolas.find((item) => item.id === escolaId)
    if (!escola) return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 })

    const anoLetivo = Number(searchParams.get("anoLetivo") ?? escola.ano_letivo)
    if (!Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100) {
      return NextResponse.json({ error: "Ano letivo inválido" }, { status: 400 })
    }
    const idsTurmas = await turmasVisiveis(perfil, escolaId)
    const turmas = idsTurmas.length
      ? await db`
          SELECT id,nome,grupo_pedagogico FROM turmas
          WHERE escola_id=${escolaId} AND ativo=true AND id=ANY(${idsTurmas}::uuid[])
          ORDER BY ano_serie,nome
        `
      : []
    const turmaIdInformada = searchParams.get("turmaId")
    const turmaId = uuidOuNulo(turmaIdInformada)
    if (turmaIdInformada && !turmaId) {
      return NextResponse.json({ error: "Turma inválida" }, { status: 400 })
    }
    if (turmaId && !idsTurmas.includes(turmaId)) {
      return NextResponse.json({ error: "Sem permissão para esta turma" }, { status: 403 })
    }

    let disciplinas: Array<{ id: string; nome: string; codigo: string }> = []
    let alunos: Array<{ id: string; nome: string; numero_chamada: number; status: string }> = []
    if (turmaId) {
      const turma = turmas.find((item) => item.id === turmaId)
      const permitidas = await disciplinasVisiveisNaTurma(perfil, escolaId, turmaId)
      const todas = turma ? await db<{ id: string; nome: string; codigo: string }[]>`
        SELECT DISTINCT d.id,d.nome,md.codigo
        FROM matriz_disciplinas md JOIN disciplinas d ON d.id=md.disciplina_id
        WHERE md.escola_id=${escolaId} AND md.etapa=${turma.grupo_pedagogico}
          AND md.ativo=true AND d.ativo=true
        ORDER BY md.codigo,d.nome
      ` : []
      disciplinas = permitidas === null ? todas : todas.filter((item) => permitidas.includes(item.id))
      alunos = await db<{ id: string; nome: string; numero_chamada: number; status: string }[]>`
        SELECT a.id,a.nome,m.numero_chamada,m.status
        FROM matriculas m JOIN alunos a ON a.id=m.aluno_id
        WHERE m.escola_id=${escolaId} AND m.turma_id=${turmaId} AND m.ano_letivo=${anoLetivo}
        ORDER BY m.numero_chamada,a.nome
      `
    } else if (capacidades.viewAllTurmasDaEscola) {
      disciplinas = await db<{ id: string; nome: string; codigo: string }[]>`
        SELECT id,nome,codigo FROM disciplinas WHERE escola_id=${escolaId} AND ativo=true ORDER BY codigo,nome
      `
    }

    if (searchParams.get("opcoes") === "1") {
      return NextResponse.json({
        escolas, escolaId, anoLetivo, bimestre: escola.bimestre_atual,
        turmas, disciplinas, alunos,
      })
    }

    const tipoParam = searchParams.get("tipo") ?? "turma"
    if (!TIPOS_RELATORIO.includes(tipoParam as TipoRelatorio)) {
      return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 })
    }
    const tipo = tipoParam as TipoRelatorio
    const bimestreParam = searchParams.get("bimestre")
    const bimestre = bimestreParam ? Number(bimestreParam) : null
    if (bimestre !== null && ![1, 2, 3, 4].includes(bimestre)) {
      return NextResponse.json({ error: "Bimestre inválido" }, { status: 400 })
    }
    const disciplinaParam = searchParams.get("disciplinaId")
    if (tipo === "intervencao" && disciplinaParam && !isDevMaster(perfil)) {
      return NextResponse.json({ error: "Filtro de matéria exclusivo do Dev Master" }, { status: 403 })
    }
    const disciplinaId = uuidOuNulo(disciplinaParam)
    const alunoParam = searchParams.get("alunoId")
    const alunoId = uuidOuNulo(alunoParam)
    if ((disciplinaParam && !disciplinaId) || (alunoParam && !alunoId)) {
      return NextResponse.json({ error: "Filtro inválido" }, { status: 400 })
    }
    if (turmaId && disciplinaId && !disciplinas.some((item) => item.id === disciplinaId)) {
      return NextResponse.json({ error: "Sem permissão para esta disciplina" }, { status: 403 })
    }
    const statusParam = searchParams.get("situacao")
    const situacao = statusParam && STATUS.includes(statusParam) ? statusParam : null
    if (statusParam && !situacao) {
      return NextResponse.json({ error: "Situação de matrícula inválida" }, { status: 400 })
    }

    const rows = idsTurmas.length ? await db`
      SELECT a.id AS aluno_id,a.nome AS aluno,m.numero_chamada,m.status AS matricula_status,
             t.id AS turma_id,t.nome AS turma,d.id AS disciplina_id,d.nome AS disciplina,
             n.bimestre,n.nota,n.status AS nota_status,n.origem_calculo,
             r.nota_anterior,r.nota_recuperacao,r.nota_final
      FROM notas n
      JOIN matriculas m ON m.id=n.matricula_id
      JOIN alunos a ON a.id=n.aluno_id
      JOIN turmas t ON t.id=n.turma_id
      JOIN disciplinas d ON d.id=n.disciplina_id
      LEFT JOIN LATERAL (
        SELECT rec.nota_anterior,rec.nota_recuperacao,rec.nota_final
        FROM recuperacoes rec
        WHERE rec.matricula_id=n.matricula_id AND rec.disciplina_id=n.disciplina_id
          AND rec.ano_letivo=n.ano_letivo AND rec.bimestre=n.bimestre AND rec.aplicado=true
        ORDER BY rec.updated_at DESC LIMIT 1
      ) r ON true
      WHERE n.escola_id=${escolaId} AND n.ano_letivo=${anoLetivo}
        AND n.turma_id=ANY(${idsTurmas}::uuid[])
        AND (${turmaId}::uuid IS NULL OR n.turma_id=${turmaId}::uuid)
        AND (${disciplinaId}::uuid IS NULL OR n.disciplina_id=${disciplinaId}::uuid)
        AND (${alunoId}::uuid IS NULL OR n.aluno_id=${alunoId}::uuid)
        AND (
          ${bimestre}::int IS NULL
          OR (${tipo === "intervencao"}::boolean AND n.bimestre<=${bimestre}::int)
          OR (${tipo !== "intervencao"}::boolean AND n.bimestre=${bimestre}::int)
        )
        AND (${situacao}::text IS NULL OR m.status=${situacao}::text)
      ORDER BY t.nome,m.numero_chamada,a.nome,d.nome,n.bimestre
      LIMIT 20000
    ` : []

    let registros = rows.map((row) => ({
      alunoId: String(row.aluno_id), aluno: String(row.aluno),
      numeroChamada: Number(row.numero_chamada), matriculaStatus: String(row.matricula_status),
      turmaId: String(row.turma_id), turma: String(row.turma),
      disciplinaId: String(row.disciplina_id), disciplina: String(row.disciplina),
      bimestre: Number(row.bimestre), nota: Number(row.nota), notaStatus: String(row.nota_status),
      origemCalculo: String(row.origem_calculo), notaAnterior: row.nota_anterior == null ? null : Number(row.nota_anterior),
      notaRecuperacao: row.nota_recuperacao == null ? null : Number(row.nota_recuperacao),
      notaFinal: row.nota_final == null ? null : Number(row.nota_final),
    })) satisfies RegistroRelatorio[]

    if (!capacidades.viewAllTurmasDaEscola) {
      const escopos = new Map<string, string[] | null>()
      await Promise.all(idsTurmas.map(async (id) => {
        escopos.set(id, await disciplinasVisiveisNaTurma(perfil, escolaId, id))
      }))
      registros = registros.filter((item) => {
        const permitidas = escopos.get(item.turmaId)
        return permitidas === null || Boolean(permitidas?.includes(item.disciplinaId))
      })
    }

    const minimoDisciplinasIntervencao = disciplinaId ? 1 : 3
    const intervencao = tipo === "intervencao"
      ? montarRelatorioIntervencao(registros, 4.5, minimoDisciplinasIntervencao)
      : null
    const resultadoBase = montarRelatorio(tipo === "intervencao" ? "turma" : tipo, registros)
    const resultado = intervencao
      ? { ...resultadoBase, linhas: intervencao.linhas }
      : resultadoBase
    const indice = calcularIndiceComposto(registros.map((item) => ({
      alunoId: item.alunoId, disciplinaId: item.disciplinaId,
      bimestre: item.bimestre, nota: item.nota,
    })))
    const geradoEm = new Date().toISOString()
    const metadados = {
      Escola: String(escola.nome), Relatório: tipo, "Ano letivo": anoLetivo,
      Bimestre: bimestre ?? "Todos", Turma: turmaId ? String(turmas.find((item) => item.id === turmaId)?.nome ?? "") : "Todas",
      Disciplina: disciplinaId ? String(disciplinas.find((item) => item.id === disciplinaId)?.nome ?? "") : "Todas",
      Situação: situacao ?? "Todas", "Gerado em": geradoEm,
    }

    if (searchParams.get("formato") === "csv") {
      await registrarAuditoria({
        usuario: perfil, escolaId, acao: "RELATORIO_EXPORTADO", tabela: "notas",
        tela: "/dashboard/relatorios", req: request, dadosNovos: { tipo, filtros: metadados, linhas: resultado.linhas.length },
      })
      const csv = gerarCsv(resultado.linhas, metadados)
      const nome = "relatorio-" + tipo + "-" + String(anoLetivo) + ".csv"
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="' + nome + '"',
          "Cache-Control": "no-store",
        },
      })
    }

    return NextResponse.json({
      metadados, ...resultado, indice,
      intervencao: intervencao ? {
        alunos: intervencao.alunos,
        mediaLimite: 4.5,
        minimoDisciplinas: minimoDisciplinasIntervencao,
      } : null,
    })
  } catch (error) {
    console.error("[relatorios]", error)
    return NextResponse.json({ error: "Erro interno ao gerar relatório" }, { status: 500 })
  }
}
