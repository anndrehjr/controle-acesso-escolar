import { NextResponse } from "next/server"
import { checkApiAuth, isDevMaster } from "../../../lib/auth"
import db from "../../../lib/db"
import { planejarRecuperacao } from "../../../lib/recuperacao"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const uuid = (valor: string | null) => valor && UUID.test(valor) ? valor : null
const TURMAS = ["9º Ano A", "6º Ano A", "3ª Série A"]

export async function GET(request: Request) {
  try {
    const perfil = await checkApiAuth(request)
    if (!isDevMaster(perfil)) return NextResponse.json({ error: "Recurso exclusivo do Dev Master" }, { status: 403 })
    const p = new URL(request.url).searchParams
    const escolas = await db`SELECT id,nome,ano_letivo FROM escolas WHERE ativo=true ORDER BY nome`
    const escolaId = uuid(p.get("escolaId")) ?? String(escolas[0]?.id ?? "")
    const escola = escolas.find((item) => String(item.id) === escolaId)
    if (!escola) return NextResponse.json({ error: "Escola inválida" }, { status: 400 })
    const anoLetivo = Number(p.get("anoLetivo") || escola.ano_letivo)
    const meta = Number(p.get("meta") || 5)
    const turmaId = uuid(p.get("turmaId")); const disciplinaId = uuid(p.get("disciplinaId")); const alunoId = uuid(p.get("alunoId"))
    if (!Number.isInteger(anoLetivo) || !Number.isFinite(meta) || meta < 0 || meta > 10)
      return NextResponse.json({ error: "Filtros numéricos inválidos" }, { status: 400 })
    if ((p.get("turmaId") && !turmaId) || (p.get("disciplinaId") && !disciplinaId) || (p.get("alunoId") && !alunoId))
      return NextResponse.json({ error: "Filtro inválido" }, { status: 400 })

    const turmas = await db`
      SELECT id,nome,ano_serie FROM turmas
      WHERE escola_id=${escolaId} AND ativo=true AND nome=ANY(${TURMAS})
      ORDER BY CASE nome WHEN '9º Ano A' THEN 1 WHEN '6º Ano A' THEN 2 ELSE 3 END`
    const disciplinas = await db`
      SELECT DISTINCT d.id,d.nome,md.codigo
      FROM turmas t JOIN matriz_disciplinas md ON md.escola_id=t.escola_id AND md.etapa=t.grupo_pedagogico AND md.ativo=true
      JOIN disciplinas d ON d.id=md.disciplina_id AND d.ativo=true
      WHERE t.escola_id=${escolaId} AND t.nome=ANY(${TURMAS})
      ORDER BY md.codigo,d.nome`
    const alunos = await db`
      SELECT DISTINCT a.id,a.nome,m.numero_chamada,t.nome AS turma
      FROM matriculas m JOIN alunos a ON a.id=m.aluno_id AND a.ativo=true JOIN turmas t ON t.id=m.turma_id
      WHERE m.escola_id=${escolaId} AND m.ano_letivo=${anoLetivo} AND m.status='ATIVA' AND t.nome=ANY(${TURMAS})
        AND (${turmaId}::uuid IS NULL OR t.id=${turmaId}::uuid)
      ORDER BY t.nome,a.nome`
    if (p.get("opcoes") === "1")
      return NextResponse.json({ data: { escolas, escolaId, escolaNome:String(escola.nome), anoLetivo, meta, turmas, disciplinas, alunos } })

    const rows = await db`
      SELECT a.id AS aluno_id,a.nome AS aluno,m.numero_chamada,t.id AS turma_id,t.nome AS turma,
             d.id AS disciplina_id,d.nome AS disciplina,COALESCE(md.codigo,d.codigo) AS codigo,
             MAX(n.nota) FILTER (WHERE n.bimestre=1 AND n.nota BETWEEN 0 AND 10) AS b1,
             MAX(n.nota) FILTER (WHERE n.bimestre=2 AND n.nota BETWEEN 0 AND 10) AS b2,
             MAX(n.nota) FILTER (WHERE n.bimestre=3 AND n.nota BETWEEN 0 AND 10) AS b3,
             MAX(n.nota) FILTER (WHERE n.bimestre=4 AND n.nota BETWEEN 0 AND 10) AS b4
      FROM matriculas m JOIN alunos a ON a.id=m.aluno_id AND a.ativo=true
      JOIN turmas t ON t.id=m.turma_id AND t.ativo=true
      JOIN matriz_disciplinas md ON md.escola_id=m.escola_id AND md.etapa=t.grupo_pedagogico AND md.ativo=true
      JOIN disciplinas d ON d.id=md.disciplina_id AND d.ativo=true
      LEFT JOIN notas n ON n.matricula_id=m.id AND n.disciplina_id=d.id AND n.ano_letivo=m.ano_letivo AND n.bimestre<=4
      WHERE m.escola_id=${escolaId} AND m.ano_letivo=${anoLetivo} AND m.status='ATIVA' AND t.nome=ANY(${TURMAS})
        AND (${turmaId}::uuid IS NULL OR t.id=${turmaId}::uuid)
        AND (${disciplinaId}::uuid IS NULL OR d.id=${disciplinaId}::uuid)
        AND (${alunoId}::uuid IS NULL OR a.id=${alunoId}::uuid)
      GROUP BY a.id,a.nome,m.numero_chamada,t.id,t.nome,d.id,d.nome,md.codigo,d.codigo
      ORDER BY CASE t.nome WHEN '9º Ano A' THEN 1 WHEN '6º Ano A' THEN 2 ELSE 3 END,m.numero_chamada,md.codigo,d.nome`
    const linhas = rows.map((r) => {
      const notas = [r.b1,r.b2,r.b3,r.b4].map((valor) => valor == null ? null : Number(valor))
      return {
        alunoId:String(r.aluno_id), aluno:String(r.aluno), numeroChamada:Number(r.numero_chamada),
        turmaId:String(r.turma_id), turma:String(r.turma), disciplinaId:String(r.disciplina_id),
        disciplina:String(r.disciplina), codigo:String(r.codigo), notas,
        ...planejarRecuperacao(notas.slice(0, 3), meta),
      }
    })
    const completos = linhas.filter((linha) => linha.dadosCompletos)
    const estatisticas = {
      alunos: new Set(linhas.map((linha) => linha.alunoId)).size,
      resultados: linhas.length,
      insuficientes: linhas.length - completos.length,
      possiveisCom7: completos.filter((linha) => linha.cenario7?.possivel).length,
      possiveisCom8: completos.filter((linha) => linha.cenario8?.possivel).length,
      impossiveisCom8: completos.filter((linha) => !linha.cenario8?.possivel).length,
    }
    return NextResponse.json({ data: { escolas, escolaId, escolaNome:String(escola.nome), anoLetivo, meta, turmas, disciplinas, alunos, estatisticas, linhas } })
  } catch (error) {
    console.error("[planejamento-recuperacao]", error)
    return NextResponse.json({ error: "Erro ao gerar o planejamento de recuperação" }, { status: 500 })
  }
}
