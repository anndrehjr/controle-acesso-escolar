import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import { avaliarDisciplina, LIMITE_PRE_REPROVADO } from "../../../../lib/analytics/avaliarDisciplina";
import { cache } from "../../../../lib/cache";
import { resolveEscolaAccess, podeVerTurma } from "../../../../lib/permissions";
import type { Aluno, Disciplina, Nota, Turma } from "../../../../lib/analytics/types";

const MEDIA_CRITICA_ACUMULADA = 4.5;
const MINIMO_DISCIPLINAS_CRITICAS = 3;

/**
 * Quantos alunos têm 3+ disciplinas em risco NESSE bimestre isoladamente
 * (é um snapshot de comparação — cada bimestre é avaliado com os dados só
 * dele). Mesma regra central de avaliarDisciplina()/LIMITE_PRE_REPROVADO
 * usada em todo o resto do sistema — só muda o recorte de tempo, que aqui é
 * intencionalmente um bimestre por vez, não a média acumulada do ano.
 */
function contarAlunosPreReprovados(alunos: Aluno[], notas: Nota[]): number {
  const notasPorAluno = new Map<string, Nota[]>();
  for (const n of notas) {
    if (n.nota == null) continue;
    if (!notasPorAluno.has(n.aluno_id)) notasPorAluno.set(n.aluno_id, []);
    notasPorAluno.get(n.aluno_id)!.push(n);
  }

  let total = 0;
  for (const aluno of alunos) {
    const notasDoAluno = notasPorAluno.get(aluno.id) ?? [];
    const porDisciplina = new Map<string, number[]>();
    for (const n of notasDoAluno) {
      const key = String(n.disciplina_id);
      if (!porDisciplina.has(key)) porDisciplina.set(key, []);
      porDisciplina.get(key)!.push(Number(n.nota));
    }

    let disciplinasRisco = 0;
    for (const notasDaDisciplina of porDisciplina.values()) {
      if (avaliarDisciplina(notasDaDisciplina).emRisco) disciplinasRisco++;
    }

    if (disciplinasRisco >= LIMITE_PRE_REPROVADO) total++;
  }
  return total;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get("turma");
    const escolaIdParam = searchParams.get("escolaId");
    const bimestreParam = Number(searchParams.get("ate") ?? "2");

    if (!turmaId) {
      return NextResponse.json({ error: "turma obrigatória" }, { status: 400 });
    }
    if (!Number.isInteger(bimestreParam) || bimestreParam < 1 || bimestreParam > 4) {
      return NextResponse.json({ error: "bimestre final inválido" }, { status: 400 });
    }

    const perfil = await checkApiAuth(request);
    if (!perfil) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const escolaId = resolveEscolaAccess(perfil, escolaIdParam);
    if (!escolaId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!(await podeVerTurma(perfil, escolaId, turmaId))) {
      return NextResponse.json({ error: "Sem permissão para esta turma" }, { status: 403 });
    }

    const [turmaData, alunos, disciplinas] = await Promise.all([
      cache.getOrSet(`turma:${turmaId}`, async () => {
        const rows = await db`SELECT * FROM turmas WHERE id = ${turmaId} AND escola_id = ${escolaId} LIMIT 1`;
        return (rows[0] ?? null) as Turma | null;
      }),
      cache.getOrSet(`alunos:${escolaId}:turma:${turmaId}`, async () => {
        const rows = await db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND turma_id = ${turmaId} AND ativo = true`;
        return rows as unknown as Aluno[];
      }),
      cache.getOrSet(`disciplinas:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM disciplinas WHERE escola_id = ${escolaId}`;
        return rows as unknown as Disciplina[];
      }),
    ]);

    if (!turmaData) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
    }

    const escolaRows = await db`SELECT ano_letivo FROM escolas WHERE id = ${escolaId} LIMIT 1`;
    const anoLetivo = (escolaRows[0]?.ano_letivo as number | undefined) ?? new Date().getFullYear();

    const numerosBimestres = Array.from({ length: bimestreParam }, (_, indice) => indice + 1);
    const notasPorBimestre = await Promise.all(
      numerosBimestres.map((bimestre) =>
        cache.getOrSet(`notas:${escolaId}:ano:${anoLetivo}:bim:${bimestre}:turma:${turmaId}`, async () => {
          const rows = await db`
            SELECT * FROM notas
            WHERE escola_id = ${escolaId}
              AND ano_letivo = ${anoLetivo}
              AND bimestre = ${bimestre}
              AND turma_id = ${turmaId}
          `;
          return rows as unknown as Nota[];
        })
      )
    );

    function buildSnapshot(notas: Nota[], bimestre: number) {
      const dashboard = buildSchoolDashboard({
        alunos,
        notas,
        turmas: [turmaData as Turma],
        disciplinas,
        bimestre,
        anoLetivo,
      });

      const mediasPorAluno = dashboard.mediasPorAluno
        .filter((item) => item.media !== null)
        .map((item) => ({
          alunoId: item.aluno.id,
          nome: item.aluno.nome,
          numeroChamada: item.aluno.numero_chamada,
          media: item.media as number,
        }));

      return {
        bimestre,
        temDados: notas.length > 0,
        mediaGeral: dashboard.mediaGeral,
        totalAlunos: dashboard.alunosAtivos.length,
        alunosCriticos: contarAlunosPreReprovados(alunos, notas),
        percentualAdequado: dashboard.percentualAdequado,
        disciplinas: dashboard.disciplinasCriticasGeral.map((d) => ({
          id: d.disciplina.id,
          nome: d.disciplina.nome,
          percentualCritico: d.percentual,
          totalNotas: d.totalNotas ?? 0,
        })),
        mediasPorAluno,
      };
    }

    const nomeDisciplina = new Map(disciplinas.map((disciplina) => [disciplina.id, disciplina.nome]));
    const notasAteTerceiro = notasPorBimestre
      .slice(0, Math.min(3, bimestreParam))
      .flat()
      .filter((nota) => nota.nota != null);
    const mediasAcumuladas = new Map<string, Map<string, number[]>>();
    for (const nota of notasAteTerceiro) {
      if (!mediasAcumuladas.has(nota.aluno_id)) mediasAcumuladas.set(nota.aluno_id, new Map());
      const porDisciplina = mediasAcumuladas.get(nota.aluno_id)!;
      const disciplinaId = String(nota.disciplina_id);
      if (!porDisciplina.has(disciplinaId)) porDisciplina.set(disciplinaId, []);
      porDisciplina.get(disciplinaId)!.push(Number(nota.nota));
    }

    const alunosEmRisco = alunos
      .map((aluno) => {
        const porDisciplina = mediasAcumuladas.get(aluno.id) ?? new Map<string, number[]>();
        const disciplinasCriticas = [...porDisciplina.entries()]
          .map(([disciplinaId, valores]) => ({
            disciplinaId,
            nome: nomeDisciplina.get(disciplinaId) ?? "Disciplina",
            media: valores.reduce((soma, valor) => soma + valor, 0) / valores.length,
          }))
          .filter((disciplina) => disciplina.media < MEDIA_CRITICA_ACUMULADA)
          .sort((a, b) => a.media - b.media || a.nome.localeCompare(b.nome, "pt-BR"));
        const todasAsNotas = [...porDisciplina.values()].flat();
        return {
          alunoId: aluno.id,
          nome: aluno.nome,
          numeroChamada: aluno.numero_chamada,
          mediaGeral: todasAsNotas.length > 0
            ? todasAsNotas.reduce((soma, valor) => soma + valor, 0) / todasAsNotas.length
            : 0,
          disciplinasCriticas,
        };
      })
      .filter((aluno) => aluno.disciplinasCriticas.length >= MINIMO_DISCIPLINAS_CRITICAS)
      .sort((a, b) => b.disciplinasCriticas.length - a.disciplinasCriticas.length || a.mediaGeral - b.mediaGeral);

    return NextResponse.json({
      turma: { id: turmaData.id, nome: turmaData.nome },
      anoLetivo,
      bimestreFinal: bimestreParam,
      bimestres: notasPorBimestre.map((notas, indice) => buildSnapshot(notas, numerosBimestres[indice])),
      indiceRisco: {
        ateBimestre: Math.min(3, bimestreParam),
        mediaLimite: MEDIA_CRITICA_ACUMULADA,
        minimoDisciplinas: MINIMO_DISCIPLINAS_CRITICAS,
        alunos: alunosEmRisco,
      },
    });
  } catch (err) {
    console.error("[comparativo]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
