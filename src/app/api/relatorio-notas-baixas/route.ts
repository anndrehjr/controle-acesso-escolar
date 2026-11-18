import { NextResponse } from "next/server";
import { checkApiAuth, isDevMaster } from "../../../lib/auth";
import db from "../../../lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Escola = { id: string; nome: string; ano_letivo: number; bimestre_atual: number };
type LinhaBanco = {
  aluno_id: string; aluno: string; turma_id: string; turma: string; numero_chamada: number;
  disciplina_id: string; disciplina: string; codigo_curricular: string; ordem_turma: number;
  b1: string | number | null; b2: string | number | null; b3: string | number | null;
  b4: string | number | null; resultado: string | number;
};

export async function GET(request: Request) {
  try {
    const perfil = await checkApiAuth(request);
    if (!isDevMaster(perfil)) {
      return NextResponse.json({ error: "Recurso exclusivo do Dev Master" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const escolas = await db<Escola[]>`
      SELECT id,nome,ano_letivo,bimestre_atual FROM escolas WHERE ativo=true ORDER BY nome
    `;
    const escolaId = searchParams.get("escolaId") || escolas[0]?.id || "";
    const escola = escolas.find((item) => item.id === escolaId);
    if (!escola) return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 });

    const anoLetivo = Number(searchParams.get("anoLetivo") || escola.ano_letivo);
    if (!Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100) {
      return NextResponse.json({ error: "Ano letivo inválido" }, { status: 400 });
    }

    const turmas = await db<{ id: string; nome: string; etapa: string; anoSerie: number; ordem: number }[]>`
      SELECT id,nome,etapa,ano_serie AS "anoSerie",
             (CASE WHEN etapa='EF' THEN ano_serie ELSE 9+ano_serie END)::int AS ordem
      FROM turmas WHERE escola_id=${escolaId} AND ativo=true
      ORDER BY ordem,nome
    `;
    const turmasInformadas = searchParams.get("turmaIds") ?? searchParams.get("turmaId") ?? "";
    const turmaIds = [...new Set(turmasInformadas.split(",").map((item) => item.trim()).filter(Boolean))];
    if (turmaIds.some((id) => !UUID.test(id) || !turmas.some((turma) => turma.id === id))) {
      return NextResponse.json({ error: "Uma ou mais turmas são inválidas" }, { status: 400 });
    }

    const disciplinas = await db<{ id: string; nome: string; codigo: string }[]>`
      SELECT d.id,d.nome,
             STRING_AGG(DISTINCT COALESCE(md.codigo,d.codigo),'/' ORDER BY COALESCE(md.codigo,d.codigo)) AS codigo
      FROM notas n
      JOIN disciplinas d ON d.id=n.disciplina_id AND d.ativo=true
      JOIN turmas t ON t.id=n.turma_id AND t.ativo=true
      LEFT JOIN matriz_disciplinas md ON md.escola_id=n.escola_id
        AND md.etapa=t.grupo_pedagogico AND md.disciplina_id=n.disciplina_id AND md.ativo=true
      WHERE n.escola_id=${escolaId} AND n.ano_letivo=${anoLetivo}
        AND (${turmaIds.length === 0}::boolean OR n.turma_id=ANY(${turmaIds}::uuid[]))
      GROUP BY d.id,d.nome
      ORDER BY codigo,d.nome
    `;
    const maximo = await db<{ bimestre: number | null }[]>`
      SELECT MAX(bimestre)::int AS bimestre FROM notas
      WHERE escola_id=${escolaId} AND ano_letivo=${anoLetivo} AND nota BETWEEN 0 AND 10
    `;
    const ultimoBimestre = Math.min(4, Math.max(1, maximo[0]?.bimestre ?? escola.bimestre_atual ?? 1));

    if (searchParams.get("opcoes") === "1") {
      return NextResponse.json({ data: { escolas, escolaId, escolaNome: escola.nome, anoLetivo, turmas, disciplinas, ultimoBimestre } });
    }

    const disciplinaInformada = searchParams.get("disciplinaId");
    const disciplinaId = disciplinaInformada && UUID.test(disciplinaInformada) ? disciplinaInformada : null;
    if (disciplinaInformada && (!disciplinaId || !disciplinas.some((item) => item.id === disciplinaId))) {
      return NextResponse.json({ error: "Disciplina inválida" }, { status: 400 });
    }
    const modo = searchParams.get("modo") === "acumulado" ? "acumulado" : "bimestre";
    const bimestre = Number(searchParams.get("bimestre") || ultimoBimestre);
    if (![1, 2, 3, 4].includes(bimestre) || bimestre > ultimoBimestre) {
      return NextResponse.json({ error: "Bimestre inválido ou ainda sem dados" }, { status: 400 });
    }

    const linhasBanco = await db<LinhaBanco[]>`
      WITH notas_periodo AS (
        SELECT n.*,a.nome AS aluno,t.nome AS turma,m.numero_chamada,d.nome AS disciplina,
               COALESCE(md.codigo,d.codigo) AS codigo_curricular,
               (CASE WHEN t.etapa='EF' THEN t.ano_serie ELSE 9+t.ano_serie END)::int AS ordem_turma
        FROM notas n
        JOIN matriculas m ON m.id=n.matricula_id AND m.status='ATIVA'
        JOIN alunos a ON a.id=m.aluno_id AND a.ativo=true
        JOIN turmas t ON t.id=m.turma_id AND t.ativo=true
        JOIN disciplinas d ON d.id=n.disciplina_id AND d.ativo=true
        LEFT JOIN matriz_disciplinas md ON md.escola_id=n.escola_id
          AND md.etapa=t.grupo_pedagogico AND md.disciplina_id=n.disciplina_id AND md.ativo=true
        WHERE n.escola_id=${escolaId} AND n.ano_letivo=${anoLetivo}
          AND (${disciplinaId}::uuid IS NULL OR n.disciplina_id=${disciplinaId}::uuid)
          AND n.bimestre<=${bimestre}
          AND n.nota BETWEEN 0 AND 10
          AND (${turmaIds.length === 0}::boolean OR n.turma_id=ANY(${turmaIds}::uuid[]))
      )
      SELECT aluno_id,aluno,turma_id,turma,numero_chamada,disciplina_id,disciplina,
             codigo_curricular,ordem_turma,
             MAX(nota) FILTER (WHERE bimestre=1) AS b1,
             MAX(nota) FILTER (WHERE bimestre=2) AS b2,
             MAX(nota) FILTER (WHERE bimestre=3) AS b3,
             MAX(nota) FILTER (WHERE bimestre=4) AS b4,
             ROUND((CASE WHEN ${modo === "bimestre"}::boolean
               THEN MAX(nota) FILTER (WHERE bimestre=${bimestre})
               ELSE AVG(nota) FILTER (WHERE bimestre<=${bimestre}) END)::numeric,2) AS resultado
      FROM notas_periodo
      GROUP BY aluno_id,aluno,turma_id,turma,numero_chamada,disciplina_id,disciplina,codigo_curricular,ordem_turma
      HAVING (CASE WHEN ${modo === "bimestre"}::boolean
        THEN MAX(nota) FILTER (WHERE bimestre=${bimestre})
        ELSE AVG(nota) FILTER (WHERE bimestre<=${bimestre}) END) < 5
      ORDER BY ordem_turma,turma,numero_chamada,aluno,codigo_curricular,disciplina
    `;

    const linhas = linhasBanco.map((item) => ({
      alunoId: item.aluno_id, aluno: item.aluno, turmaId: item.turma_id, turma: item.turma,
      numeroChamada: Number(item.numero_chamada), disciplinaId: item.disciplina_id, disciplina: item.disciplina,
      codigoCurricular: item.codigo_curricular, ordemTurma: Number(item.ordem_turma),
      b1: item.b1 == null ? null : Number(item.b1), b2: item.b2 == null ? null : Number(item.b2),
      b3: item.b3 == null ? null : Number(item.b3), b4: item.b4 == null ? null : Number(item.b4),
      resultado: Number(item.resultado),
    }));
    const disciplina = disciplinaId ? disciplinas.find((item) => item.id === disciplinaId) : null;
    const totalAlunos = new Set(linhas.map((item) => item.alunoId)).size;
    return NextResponse.json({
      data: {
        escolas, escolaId, escolaNome: escola.nome, anoLetivo, turmas, disciplinas, ultimoBimestre,
        turmaIds, disciplinaId: disciplinaId ?? "", disciplinaNome: disciplina?.nome ?? "Todas as disciplinas", modo, bimestre,
        criterio: "Nota inferior a 5,0", total: totalAlunos, totalResultados: linhas.length, linhas,
      },
    });
  } catch (error) {
    console.error("[relatorio-notas-baixas]", error);
    return NextResponse.json({ error: "Erro ao gerar relatório de notas baixas" }, { status: 500 });
  }
}
