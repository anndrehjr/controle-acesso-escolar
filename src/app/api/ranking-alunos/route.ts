import { NextResponse } from "next/server";
import { checkApiAuth, isDevMaster } from "../../../lib/auth";
import db from "../../../lib/db";
import { atribuirPosicoes } from "../../../lib/ranking/posicoes";

type LinhaRanking = {
  aluno_id: string;
  aluno: string;
  turma_id: string;
  turma: string;
  numero_chamada: number;
  media: string | number;
  total_notas: string | number;
  total_disciplinas: string | number;
};

export async function GET(request: Request) {
  try {
    const perfil = await checkApiAuth(request);
    if (!isDevMaster(perfil)) return NextResponse.json({ error: "Recurso exclusivo do Dev Master" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const escolas = await db<{ id: string; nome: string; ano_letivo: number; bimestre_atual: number }[]>`
      SELECT id, nome, ano_letivo, bimestre_atual FROM escolas WHERE ativo = true ORDER BY nome
    `;
    const escolaId = searchParams.get("escolaId") || escolas[0]?.id || "";
    const escola = escolas.find((item) => item.id === escolaId);
    if (!escola) return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 });

    const turmaId = searchParams.get("turmaId") || null;
    const periodoInformado = searchParams.get("periodo") || "acumulado";
    const bimestre = periodoInformado === "acumulado" ? null : Number(periodoInformado);
    if (bimestre !== null && (![1, 2, 3, 4].includes(bimestre))) {
      return NextResponse.json({ error: "Bimestre inválido" }, { status: 400 });
    }

    const turmas = await db<{ id: string; nome: string }[]>`
      SELECT id, nome FROM turmas WHERE escola_id = ${escolaId} AND ativo = true ORDER BY ano_serie, nome
    `;
    if (turmaId && !turmas.some((turma) => turma.id === turmaId)) {
      return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
    }

    const maximoRows = await db<{ maximo: number | null }[]>`
      SELECT MAX(bimestre)::int AS maximo FROM notas
      WHERE escola_id = ${escolaId} AND ano_letivo = ${escola.ano_letivo} AND nota BETWEEN 0 AND 10
    `;
    const ultimoBimestreComDados = maximoRows[0]?.maximo ?? escola.bimestre_atual ?? 1;
    const limiteAcumulado = Math.min(4, Math.max(1, ultimoBimestreComDados));

    const linhas = await db<LinhaRanking[]>`
      SELECT a.id AS aluno_id, a.nome AS aluno, t.id AS turma_id, t.nome AS turma,
             m.numero_chamada, ROUND(AVG(n.nota)::numeric, 2) AS media,
             COUNT(n.id)::int AS total_notas, COUNT(DISTINCT n.disciplina_id)::int AS total_disciplinas
      FROM matriculas m
      JOIN alunos a ON a.id = m.aluno_id AND a.ativo = true
      JOIN turmas t ON t.id = m.turma_id AND t.ativo = true
      JOIN notas n ON n.matricula_id = m.id
      WHERE m.escola_id = ${escolaId}
        AND m.ano_letivo = ${escola.ano_letivo}
        AND m.status = 'ATIVA'
        AND n.ano_letivo = ${escola.ano_letivo}
        AND n.nota BETWEEN 0 AND 10
        AND (${turmaId}::uuid IS NULL OR m.turma_id = ${turmaId}::uuid)
        AND ((${bimestre}::int IS NULL AND n.bimestre <= ${limiteAcumulado}) OR n.bimestre = ${bimestre}::int)
      GROUP BY a.id, a.nome, t.id, t.nome, m.numero_chamada
      HAVING COUNT(n.id) > 0
      ORDER BY AVG(n.nota) DESC, a.nome ASC
    `;

    const ranking = atribuirPosicoes(linhas.map((linha) => ({
      alunoId: linha.aluno_id,
      aluno: linha.aluno,
      turmaId: linha.turma_id,
      turma: linha.turma,
      numeroChamada: Number(linha.numero_chamada),
      media: Number(linha.media),
      totalNotas: Number(linha.total_notas),
      totalDisciplinas: Number(linha.total_disciplinas),
    })));

    const mediaEscola = ranking.length ? ranking.reduce((soma, item) => soma + item.media, 0) / ranking.length : null;
    return NextResponse.json({
      data: {
        escolas,
        escolaId,
        escolaNome: escola.nome,
        anoLetivo: escola.ano_letivo,
        turmas,
        turmaId,
        periodo: bimestre === null ? "acumulado" : String(bimestre),
        ultimoBimestreComDados: limiteAcumulado,
        totalAlunos: ranking.length,
        mediaEscola: mediaEscola === null ? null : Number(mediaEscola.toFixed(2)),
        ranking,
      },
    });
  } catch (error) {
    console.error("[ranking-alunos]", error);
    return NextResponse.json({ error: "Erro ao calcular ranking" }, { status: 500 });
  }
}
