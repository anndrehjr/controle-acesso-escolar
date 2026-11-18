import { NextResponse } from "next/server"
import { checkApiAuth, isDevMaster } from "../../../lib/auth"
import db from "../../../lib/db"
import { projetarNotas } from "../../../lib/projecao-notas"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const uuid = (v: string | null) => v && UUID.test(v) ? v : null
const STATUS = ["ATIVA", "TRANSFERIDA", "CONCLUIDA", "CANCELADA"]

export async function GET(request: Request) {
  try {
    const perfil = await checkApiAuth(request)
    if (!isDevMaster(perfil)) return NextResponse.json({ error: "Recurso exclusivo do Dev Master" }, { status: 403 })
    const p = new URL(request.url).searchParams
    const escolas = await db`SELECT id,nome,ano_letivo,bimestre_atual FROM escolas WHERE ativo=true ORDER BY nome`
    const escolaId = uuid(p.get("escolaId")) ?? String(escolas[0]?.id ?? "")
    const escola = escolas.find((e) => String(e.id) === escolaId)
    if (!escola) return NextResponse.json({ error: "Escola inválida" }, { status: 400 })
    const anoLetivo = Number(p.get("anoLetivo") || escola.ano_letivo)
    const referencia = Number(p.get("bimestre") || Math.min(4, Number(escola.bimestre_atual || 3)))
    const meta = Number(p.get("meta") || 5)
    if (!Number.isInteger(anoLetivo) || ![1,2,3,4].includes(referencia) || !Number.isFinite(meta) || meta < 0 || meta > 10)
      return NextResponse.json({ error: "Filtros numéricos inválidos" }, { status: 400 })
    const turmaId = uuid(p.get("turmaId")); const disciplinaId = uuid(p.get("disciplinaId")); const alunoId = uuid(p.get("alunoId"))
    if ((p.get("turmaId") && !turmaId) || (p.get("disciplinaId") && !disciplinaId) || (p.get("alunoId") && !alunoId))
      return NextResponse.json({ error: "Filtro inválido" }, { status: 400 })
    const situacao = STATUS.includes(p.get("situacao") || "") ? p.get("situacao")! : "ATIVA"
    const turmas = await db`SELECT id,nome,etapa,ano_serie FROM turmas WHERE escola_id=${escolaId} AND ativo=true ORDER BY CASE WHEN etapa='EF' THEN ano_serie ELSE 9+ano_serie END,nome`
    const disciplinas = await db`SELECT id,nome,codigo FROM disciplinas WHERE escola_id=${escolaId} AND ativo=true ORDER BY codigo,nome`
    const alunos = turmaId ? await db`SELECT DISTINCT a.id,a.nome,m.numero_chamada FROM matriculas m JOIN alunos a ON a.id=m.aluno_id WHERE m.escola_id=${escolaId} AND m.turma_id=${turmaId} AND m.ano_letivo=${anoLetivo} ORDER BY a.nome` : []
    if (p.get("opcoes") === "1") return NextResponse.json({ data: { escolas, escolaId, anoLetivo, referencia, turmas, disciplinas, alunos } })

    const rows = await db`
      SELECT a.id AS aluno_id,a.nome AS aluno,m.numero_chamada,m.status,t.id AS turma_id,t.nome AS turma,
             d.id AS disciplina_id,d.nome AS disciplina,COALESCE(md.codigo,d.codigo) AS codigo,
             MAX(n.nota) FILTER (WHERE n.bimestre=1 AND n.nota BETWEEN 0 AND 10) AS b1,
             MAX(n.nota) FILTER (WHERE n.bimestre=2 AND n.nota BETWEEN 0 AND 10) AS b2,
             MAX(n.nota) FILTER (WHERE n.bimestre=3 AND n.nota BETWEEN 0 AND 10) AS b3,
             MAX(n.nota) FILTER (WHERE n.bimestre=4 AND n.nota BETWEEN 0 AND 10) AS b4,
             (CASE WHEN t.etapa='EF' THEN t.ano_serie ELSE 9+t.ano_serie END)::int AS ordem
      FROM matriculas m JOIN alunos a ON a.id=m.aluno_id AND a.ativo=true
      JOIN turmas t ON t.id=m.turma_id AND t.ativo=true
      JOIN matriz_disciplinas md ON md.escola_id=m.escola_id AND md.etapa=t.grupo_pedagogico AND md.ativo=true
      JOIN disciplinas d ON d.id=md.disciplina_id AND d.ativo=true
      LEFT JOIN notas n ON n.matricula_id=m.id AND n.disciplina_id=d.id AND n.ano_letivo=m.ano_letivo AND n.bimestre<=${referencia}
      WHERE m.escola_id=${escolaId} AND m.ano_letivo=${anoLetivo} AND m.status=${situacao}
        AND (${turmaId}::uuid IS NULL OR t.id=${turmaId}::uuid)
        AND (${disciplinaId}::uuid IS NULL OR d.id=${disciplinaId}::uuid)
        AND (${alunoId}::uuid IS NULL OR a.id=${alunoId}::uuid)
      GROUP BY a.id,a.nome,m.numero_chamada,m.status,t.id,t.nome,t.etapa,t.ano_serie,d.id,d.nome,md.codigo,d.codigo
      ORDER BY ordem,t.nome,m.numero_chamada,a.nome,md.codigo,d.nome`
    const linhas = rows.map((r) => {
      const notas = [r.b1,r.b2,r.b3,r.b4].map((n) => n == null ? null : Number(n))
      const projecao = projetarNotas(notas, meta, { notasInteiras: true })
      return { alunoId:String(r.aluno_id), aluno:String(r.aluno), numeroChamada:Number(r.numero_chamada), situacaoMatricula:String(r.status), turmaId:String(r.turma_id), turma:String(r.turma), disciplinaId:String(r.disciplina_id), disciplina:String(r.disciplina), codigo:String(r.codigo), ...projecao }
    })
    const ids = new Set(linhas.map((l) => l.alunoId)); const porAluno = [...ids].map((id) => linhas.filter((l) => l.alunoId === id))
    const estatisticas = {
      alunos: ids.size, disciplinas: new Set(linhas.map((l) => l.disciplinaId)).size, resultados: linhas.length,
      garantidos: porAluno.filter((ls) => ls.every((l) => l.situacao === "GARANTIDA")).length,
      precisamMelhorar: porAluno.filter((ls) => ls.some((l) => ["ALCANCAVEL","ATENCAO"].includes(l.situacao))).length,
      inalcançaveis: porAluno.filter((ls) => ls.some((l) => l.situacao === "INALCANCAVEL")).length,
      notaAlta: porAluno.filter((ls) => ls.some((l) => (l.mediaNecessaria ?? 0) > 7 && (l.mediaNecessaria ?? 0) <= 10)).length,
      incompletos: porAluno.filter((ls) => ls.some((l) => l.situacao === "DADOS_INSUFICIENTES")).length,
    }
    return NextResponse.json({ data: { escolas, escolaId, escolaNome:String(escola.nome), anoLetivo, referencia, meta, turmas, disciplinas, alunos, estatisticas, linhas } })
  } catch (error) { console.error("[projecao-notas]", error); return NextResponse.json({ error: "Erro ao gerar projeção de notas" }, { status: 500 }) }
}
