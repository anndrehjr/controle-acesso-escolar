import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { requireAuth } from "../../lib/requireAuth";
import db from "../../lib/db";
import { buildSchoolDashboard } from "../../lib/analytics/buildSchoolDashboard";
import { buildAlertas } from "../../lib/analytics/buildAlertas";
import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "../../lib/analytics/types";

import AnalyticsHeaderNav from "../../components/analytics/AnalyticsHeaderNav";
import ResumoCards from "../../components/analytics/ResumoCards";
import TabelaComparativa from "../../components/analytics/TabelaComparativa";
import EvolucaoTurmasLista from "../../components/analytics/EvolucaoTurmasLista";
import RecomposicaoCard from "../../components/analytics/RecomposicaoCard";
import AlertasTextoList from "../../components/analytics/AlertasTextoList";
import TendenciaBimestres from "../../components/escola-dashboard/TendenciaBimestres";
import DisciplinasCriticas from "../../components/escola-dashboard/DisciplinasCriticas";

const ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

type RecomposicaoItem = {
  disciplina: { id: string; nome: string };
  abaixoB1: number;
  abaixoB2: number;
  recuperados: number;
};

export default async function AnalyticsPage() {
  const usuario = await requireAuth();
  if (!usuario) redirect("/login");

  const escolaRows = await db`SELECT * FROM escolas WHERE id = ${ESCOLA_ID} LIMIT 1`;
  const escola = escolaRows[0];
  if (!escola) redirect("/dashboard");

  const bimestreAtual = (escola.bimestre_atual as number | undefined) ?? 2;
  const anoLetivo = (escola.ano_letivo as number | undefined) ?? 2026;

  const [turmasRows, alunosRows, disciplinasRows, matrizRows] = await Promise.all([
    db`SELECT * FROM turmas WHERE escola_id = ${ESCOLA_ID} ORDER BY ano_serie ASC`,
    db`SELECT * FROM alunos WHERE escola_id = ${ESCOLA_ID} AND ativo = true`,
    db`SELECT * FROM disciplinas WHERE escola_id = ${ESCOLA_ID}`,
    db`SELECT * FROM matriz_disciplinas WHERE escola_id = ${ESCOLA_ID}`,
  ]);

  const turmas = turmasRows as unknown as Turma[];
  const alunos = alunosRows as unknown as Aluno[];
  const disciplinas = disciplinasRows as unknown as Disciplina[];
  const matriz = matrizRows as unknown as MatrizDisciplina[];

  const todasNotas = await db`
    SELECT * FROM notas WHERE escola_id = ${ESCOLA_ID} AND ano_letivo = ${anoLetivo}
  ` as unknown as Nota[];

  const notasPorBim = (b: number) => todasNotas.filter(n => Number(n.bimestre) === b);
  const notasB = [1, 2, 3, 4].map((_, i) => notasPorBim(i + 1));

  const builds = notasB.map((notas, idx) =>
    buildSchoolDashboard({ alunos, notas, turmas, disciplinas, bimestre: idx + 1, anoLetivo })
  );

  const dashAtual = builds[bimestreAtual - 1];
  const dashAnterior = bimestreAtual > 1 ? builds[bimestreAtual - 2] : null;

  const alertas = buildAlertas({
    alunos,
    notas: notasB[bimestreAtual - 1],
    turmas,
    disciplinas,
    matriz,
  });

  const delta = dashAnterior
    ? Number((dashAtual.mediaGeral - dashAnterior.mediaGeral).toFixed(1))
    : null;

  // Tabela comparativa por disciplina
  const tabelaDisciplinas = disciplinas.map(d => {
    const bims = notasB.map((notas, idx) => {
      const nd = notas.filter(n => n.disciplina_id === d.id);
      const media = nd.length > 0
        ? Number((nd.reduce((s, n) => s + Number(n.nota), 0) / nd.length).toFixed(1))
        : null;
      return { bimestre: idx + 1, media, temDados: nd.length > 0 };
    });
    const primeiro = bims.find(b => b.temDados);
    const ultimo = [...bims].reverse().find(b => b.temDados);
    const evolucao =
      primeiro && ultimo && primeiro !== ultimo &&
      primeiro.media !== null && ultimo.media !== null
        ? Number((ultimo.media - primeiro.media).toFixed(1))
        : null;
    return { disciplina: d, bims, evolucao };
  }).filter(r => r.bims.some(b => b.temDados));

  // Evolucao por turma
  const evolucaoTurmas = turmas.map(t => {
    const ids = new Set(alunos.filter(a => a.turma_id === t.id).map(a => a.id));
    const mediaBim = (b: number) => {
      const notas = notasB[b - 1].filter(n => ids.has(n.aluno_id));
      return notas.length > 0
        ? Number((notas.reduce((s, n) => s + Number(n.nota), 0) / notas.length).toFixed(1))
        : null;
    };
    const mediaAtual = mediaBim(bimestreAtual);
    const mediaAnt = bimestreAtual > 1 ? mediaBim(bimestreAtual - 1) : null;
    const d =
      mediaAtual !== null && mediaAnt !== null
        ? Number((mediaAtual - mediaAnt).toFixed(1))
        : null;
    return {
      turma: { id: t.id, nome: t.nome },
      media: mediaAtual,
      mediaAnterior: mediaAnt,
      delta: d,
      temDados: mediaAtual !== null,
    };
  }).filter(t => t.temDados);

  // Recomposicao B1 vs B2
  const recomposicao: RecomposicaoItem[] = bimestreAtual >= 2
    ? disciplinas.flatMap(d => {
        const b1 = notasB[0].filter(n => n.disciplina_id === d.id);
        const b2 = notasB[1].filter(n => n.disciplina_id === d.id);
        if (b1.length === 0 || b2.length === 0) return [];
        const abaixoB1 = b1.filter(n => Number(n.nota) < 5).length;
        const abaixoB2 = b2.filter(n => Number(n.nota) < 5).length;
        return [{ disciplina: d, abaixoB1, abaixoB2, recuperados: Math.max(0, abaixoB1 - abaixoB2) }];
      })
    : [];

  // Melhor e pior disciplina por media atual
  const discComDados = tabelaDisciplinas.filter(d => d.bims[bimestreAtual - 1]?.temDados);
  const melhorDisciplina = discComDados.length > 0
    ? discComDados.reduce((best, d) =>
        (d.bims[bimestreAtual - 1]?.media ?? 0) > (best.bims[bimestreAtual - 1]?.media ?? 0) ? d : best
      ).disciplina.nome
    : "-";
  const piorDisciplina = discComDados.length > 0
    ? discComDados.reduce((worst, d) =>
        (d.bims[bimestreAtual - 1]?.media ?? 10) < (worst.bims[bimestreAtual - 1]?.media ?? 10) ? d : worst
      ).disciplina.nome
    : "-";

  // Turma que mais evoluiu
  const turmaMaisEvoluiu = [...evolucaoTurmas].sort(
    (a, b) => (b.delta ?? -99) - (a.delta ?? -99)
  )[0];

  // Alertas automaticos
  const alertasTexto: string[] = [];
  if (delta !== null) {
    if (delta > 0.1)
      alertasTexto.push(`A media geral subiu ${delta.toFixed(1)} pontos em relacao ao ${bimestreAtual - 1}o bimestre.`);
    else if (delta < -0.1)
      alertasTexto.push(`A media geral caiu ${Math.abs(delta).toFixed(1)} pontos em relacao ao ${bimestreAtual - 1}o bimestre.`);
    else
      alertasTexto.push(`A media geral manteve-se estavel em relacao ao ${bimestreAtual - 1}o bimestre.`);
  }
  if (dashAtual.melhorTurma && dashAtual.melhorTurma.media > 0)
    alertasTexto.push(`${dashAtual.melhorTurma.turma.nome} e a turma com melhor desempenho (media ${dashAtual.melhorTurma.media.toFixed(1)}).`);
  if (
    dashAtual.turmaAlerta &&
    dashAtual.turmaAlerta.turma.id !== dashAtual.melhorTurma?.turma.id &&
    dashAtual.turmaAlerta.media < 6
  )
    alertasTexto.push(`${dashAtual.turmaAlerta.turma.nome} necessita de atencao pedagogica (media ${dashAtual.turmaAlerta.media.toFixed(1)}).`);
  if (dashAtual.disciplinaMaisCritica && dashAtual.disciplinaMaisCritica.percentual > 0)
    alertasTexto.push(`${dashAtual.disciplinaMaisCritica.disciplina.nome} tem o maior indice de alunos abaixo da media (${dashAtual.disciplinaMaisCritica.percentual.toFixed(0)}%).`);
  if (alertas.criticos.length > 0)
    alertasTexto.push(`${alertas.criticos.length} aluno${alertas.criticos.length !== 1 ? "s estao" : " esta"} em estado critico (4 ou mais disciplinas abaixo de 5,0).`);

  return (
    <main className="min-h-screen p-6 md:p-8 space-y-8">
      <AnalyticsHeaderNav
        nome={escola.nome as string}
        cidade={(escola.cidade as string | undefined) ?? ""}
        estado={(escola.estado as string | undefined) ?? ""}
        bimestre={bimestreAtual}
        anoLetivo={anoLetivo}
      />

      <ResumoCards
        mediaGeral={dashAtual.mediaGeral}
        deltaMedia={delta}
        totalAlunos={dashAtual.alunosAtivos.length}
        alunosCriticos={alertas.criticos.length}
        alunosAtencao={alertas.atencao.length}
        melhorDisciplina={melhorDisciplina}
        piorDisciplina={piorDisciplina}
        melhorTurma={dashAtual.melhorTurma?.turma.nome ?? "-"}
        melhorTurmaMedia={dashAtual.melhorTurma?.media ?? 0}
        turmaMaisEvoluiu={turmaMaisEvoluiu?.turma.nome ?? "-"}
        deltaTurmaMaisEvoluiu={turmaMaisEvoluiu?.delta ?? null}
        bimestre={bimestreAtual}
      />

      <TendenciaBimestres />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TabelaComparativa disciplinas={tabelaDisciplinas} bimestreAtual={bimestreAtual} />
        <DisciplinasCriticas
          geral={dashAtual.disciplinasCriticasGeral}
          fundamental={dashAtual.disciplinasCriticasFundamental}
          medio={dashAtual.disciplinasCriticasMedio}
        />
      </div>

      <EvolucaoTurmasLista turmas={evolucaoTurmas} bimestreAtual={bimestreAtual} />

      {recomposicao.length > 0 && (
        <RecomposicaoCard disciplinas={recomposicao} />
      )}

      <AlertasTextoList alertas={alertasTexto} />
    </main>
  );
}
