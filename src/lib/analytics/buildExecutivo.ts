import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "./types";
import { buildSchoolDashboard } from "./buildSchoolDashboard";
import { buildRiscoAcademico } from "./buildRiscoAcademico";
import { separarTurmasPorNivel } from "./nivelEnsino";

const BIMESTRES = [1, 2, 3, 4] as const;
const LABELS: Record<number, string> = { 1: "1º Bim", 2: "2º Bim", 3: "3º Bim", 4: "4º Bim" };

export type BimestreSnapshot = {
  bimestre: number;
  label: string;
  temDados: boolean;
  media: number | null;
  totalNotas: number;
  /** Cumulativo: alunos com 3+ disciplinas em risco até este bimestre (checkpoint) */
  criticos: number;
  /** Cumulativo: alunos com 1-2 disciplinas em risco até este bimestre (checkpoint) */
  atencao: number;
  /** Ids dos alunos em "atenção" nesse checkpoint — usado pra calcular quem entrou/saiu */
  atencaoIds: string[];
  /** Ids dos alunos "pré-reprovados" (3+ disciplinas) nesse checkpoint */
  criticoIds: string[];
  percentualAdequado: number | null;
};

export type RankingItem = {
  id: string;
  nome: string;
  media: number | null;
  totalAlunosOuNotas: number;
  /** média do último bimestre com dados − média do primeiro bimestre com dados */
  evolucao: number | null;
  /** média do último bimestre com dados − média do penúltimo (ambos com dados) */
  deltaUltimoBimestre: number | null;
  /** Só preenchido no ranking de turmas: % de alunos com média >= 7 (adequado ou avançado) */
  percentualAdequado?: number | null;
};

type Params = {
  alunos: Aluno[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  matriz: MatrizDisciplina[];
  todasNotas: Nota[];
  anoLetivo: number;
};

function media(valores: number[]): number | null {
  return valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
}

function evolucaoEDelta(bims: { bimestre: number; media: number | null }[]) {
  const comDados = bims.filter((b) => b.media !== null);
  if (comDados.length === 0) return { evolucao: null, deltaUltimoBimestre: null };
  const primeiro = comDados[0].media as number;
  const ultimo = comDados[comDados.length - 1].media as number;
  const evolucao = comDados.length > 1 ? Number((ultimo - primeiro).toFixed(2)) : null;
  const penultimo = comDados.length > 1 ? (comDados[comDados.length - 2].media as number) : null;
  const deltaUltimoBimestre = penultimo !== null ? Number((ultimo - penultimo).toFixed(2)) : null;
  return { evolucao, deltaUltimoBimestre };
}

/**
 * Monta todos os dados do dashboard executivo: evolução por bimestre (média
 * geral + zona de atenção, cumulativos), rankings de disciplinas e turmas
 * (com evolução e comparação com o bimestre anterior), sempre separando
 * Fundamental de Médio onde faz sentido pedagógico.
 */
export function buildExecutivo({ alunos, turmas, disciplinas, matriz, todasNotas, anoLetivo }: Params) {
  const notasPorBim = (b: number) =>
    todasNotas.filter((n) => Number(n.bimestre) === b && Number(n.ano_letivo) === anoLetivo);
  const notasAte = (b: number) =>
    todasNotas.filter((n) => Number(n.bimestre) <= b && Number(n.ano_letivo) === anoLetivo);

  const bimestresComDados: number[] = BIMESTRES.filter((b) => notasPorBim(b).length > 0);
  const ultimoBimestreComDados = bimestresComDados.length > 0 ? Math.max(...bimestresComDados) : 1;

  // Snapshot por bimestre (isolado) + risco cumulativo (checkpoint) em cada um.
  const snapshots: BimestreSnapshot[] = BIMESTRES.map((bimestre) => {
    const notasBim = notasPorBim(bimestre);
    const dash = buildSchoolDashboard({ alunos, notas: notasBim, turmas, disciplinas, bimestre, anoLetivo });
    const temDados = dash.notasValidas.length > 0;

    const risco = buildRiscoAcademico({ alunos, notas: notasAte(bimestre), turmas, disciplinas, matriz });

    return {
      bimestre,
      label: LABELS[bimestre],
      temDados,
      media: temDados ? Number(dash.mediaGeral.toFixed(2)) : null,
      totalNotas: dash.notasValidas.length,
      criticos: risco.criticos.length,
      atencao: risco.atencao.length,
      atencaoIds: risco.atencao.map((a) => a.alunoId),
      criticoIds: risco.criticos.map((a) => a.alunoId),
      percentualAdequado: temDados ? Number(dash.percentualAdequado.toFixed(1)) : null,
    };
  });

  const snapshotAtual = snapshots[ultimoBimestreComDados - 1];
  const snapshotAnterior = ultimoBimestreComDados > 1 ? snapshots[ultimoBimestreComDados - 2] : null;

  // Média anual acumulada = média de todas as notas do ano até agora, não o snapshot de um bimestre.
  const dashAnual = buildSchoolDashboard({
    alunos,
    notas: notasAte(ultimoBimestreComDados),
    turmas,
    disciplinas,
    anoLetivo,
  });
  const mediaAnualAcumulada = dashAnual.notasValidas.length > 0 ? Number(dashAnual.mediaGeral.toFixed(2)) : null;

  // Quem entrou/saiu da zona de atenção entre o penúltimo e o último checkpoint com dados.
  const checkpointsComDados = bimestresComDados.map((b) => snapshots[b - 1]);
  const checkpointAtual = checkpointsComDados[checkpointsComDados.length - 1] ?? null;
  const checkpointAnterior =
    checkpointsComDados.length > 1 ? checkpointsComDados[checkpointsComDados.length - 2] : null;
  const entraramNaAtencao = checkpointAnterior
    ? (checkpointAtual?.atencaoIds ?? []).filter((id) => !checkpointAnterior.atencaoIds.includes(id)).length
    : 0;
  const sairamDaAtencao = checkpointAnterior
    ? checkpointAnterior.atencaoIds.filter((id) => !(checkpointAtual?.atencaoIds ?? []).includes(id)).length
    : 0;
  const entraramNoCritico = checkpointAnterior
    ? (checkpointAtual?.criticoIds ?? []).filter((id) => !checkpointAnterior.criticoIds.includes(id)).length
    : 0;
  const sairamDoCritico = checkpointAnterior
    ? checkpointAnterior.criticoIds.filter((id) => !(checkpointAtual?.criticoIds ?? []).includes(id)).length
    : 0;

  // Ranking de disciplinas — sempre separado por nível de ensino.
  const { fundamental: turmasFund, medio: turmasMedio } = separarTurmasPorNivel(turmas);

  function rankingDisciplinas(turmasDoNivel: Turma[]): RankingItem[] {
    const idsTurmas = new Set(turmasDoNivel.map((t) => t.id));
    return disciplinas
      .map((d) => {
        const bims = BIMESTRES.map((b) => {
          const notas = notasPorBim(b).filter((n) => n.disciplina_id === d.id && idsTurmas.has(n.turma_id));
          return { bimestre: b, media: notas.length > 0 ? media(notas.map((n) => Number(n.nota))) : null };
        });
        const notasAcumuladas = notasAte(ultimoBimestreComDados).filter(
          (n) => n.disciplina_id === d.id && idsTurmas.has(n.turma_id)
        );
        const mediaGeralDisc = media(notasAcumuladas.map((n) => Number(n.nota)));
        const { evolucao, deltaUltimoBimestre } = evolucaoEDelta(bims);
        return {
          id: d.id,
          nome: d.nome,
          media: mediaGeralDisc !== null ? Number(mediaGeralDisc.toFixed(2)) : null,
          totalAlunosOuNotas: notasAcumuladas.length,
          evolucao,
          deltaUltimoBimestre,
        };
      })
      .filter((item) => item.totalAlunosOuNotas > 0);
  }

  const rankingDisciplinasFundamental = rankingDisciplinas(turmasFund);
  const rankingDisciplinasMedio = rankingDisciplinas(turmasMedio);

  // Ranking de turmas (todas juntas — turma já é uma unidade única por natureza, não se
  // "mistura" fundamental com médio numa mesma turma).
  const rankingTurmas: RankingItem[] = turmas
    .map((t) => {
      const idsAlunosDaTurma = new Set(alunos.filter((a) => a.turma_id === t.id).map((a) => a.id));
      const bims = BIMESTRES.map((b) => {
        const notas = notasPorBim(b).filter((n) => idsAlunosDaTurma.has(n.aluno_id));
        return { bimestre: b, media: notas.length > 0 ? media(notas.map((n) => Number(n.nota))) : null };
      });
      const notasAcumuladas = notasAte(ultimoBimestreComDados).filter((n) => idsAlunosDaTurma.has(n.aluno_id));
      const mediaGeralTurma = media(notasAcumuladas.map((n) => Number(n.nota)));
      const { evolucao, deltaUltimoBimestre } = evolucaoEDelta(bims);
      const comNota = new Set(notasAcumuladas.map((n) => n.aluno_id));
      const adequados = [...comNota].filter((alunoId) => {
        const notasAluno = notasAcumuladas.filter((n) => n.aluno_id === alunoId);
        const m = media(notasAluno.map((n) => Number(n.nota)));
        return m !== null && m >= 7;
      });
      return {
        id: t.id,
        nome: t.nome,
        media: mediaGeralTurma !== null ? Number(mediaGeralTurma.toFixed(2)) : null,
        totalAlunosOuNotas: idsAlunosDaTurma.size,
        evolucao,
        deltaUltimoBimestre,
        percentualAdequado: comNota.size > 0 ? Number(((adequados.length / comNota.size) * 100).toFixed(1)) : null,
      };
    })
    .filter((item) => item.media !== null);

  // Alunos críticos/atenção — total geral + separado por nível.
  const riscoAtual = buildRiscoAcademico({
    alunos,
    notas: notasAte(ultimoBimestreComDados),
    turmas,
    disciplinas,
    matriz,
  });
  const idsTurmaFund = new Set(turmasFund.map((t) => t.id));
  const idsTurmaMedio = new Set(turmasMedio.map((t) => t.id));
  const contarPorNivel = (ids: Set<string>) => ({
    criticos: riscoAtual.criticos.filter((a) => ids.has(a.turmaId)).length,
    atencao: riscoAtual.atencao.filter((a) => ids.has(a.turmaId)).length,
  });

  // Matrícula atual — situação de agora, sem inventar quando cada transferência
  // aconteceu (o banco não guarda a data disso, só o status atual do aluno).
  const totalAtivos = alunos.filter((a) => a.status !== "TRANSFERIDO").length;
  const totalTransferidos = alunos.filter((a) => a.status === "TRANSFERIDO").length;
  const matriculaPorTurma = turmas
    .map((t) => ({
      id: t.id,
      nome: t.nome,
      ativos: alunos.filter((a) => a.turma_id === t.id && a.status !== "TRANSFERIDO").length,
      transferidos: alunos.filter((a) => a.turma_id === t.id && a.status === "TRANSFERIDO").length,
    }))
    .filter((t) => t.ativos > 0 || t.transferidos > 0)
    .sort((a, b) => b.ativos - a.ativos);

  return {
    ultimoBimestreComDados,
    bimestresComDados,
    snapshots,
    snapshotAtual,
    snapshotAnterior,
    mediaAnualAcumulada,
    entraramNaAtencao,
    sairamDaAtencao,
    entraramNoCritico,
    sairamDoCritico,
    rankingDisciplinasFundamental,
    rankingDisciplinasMedio,
    rankingTurmas,
    alunosCriticosGeral: riscoAtual.criticos.length,
    alunosAtencaoGeral: riscoAtual.atencao.length,
    alunosCriticosFundamental: contarPorNivel(idsTurmaFund).criticos,
    alunosAtencaoFundamental: contarPorNivel(idsTurmaFund).atencao,
    alunosCriticosMedio: contarPorNivel(idsTurmaMedio).criticos,
    alunosAtencaoMedio: contarPorNivel(idsTurmaMedio).atencao,
    totalAtivos,
    totalTransferidos,
    matriculaPorTurma,
  };
}

export type ExecutivoResult = ReturnType<typeof buildExecutivo>;

/**
 * Observações automáticas — evoluem conforme mais bimestres vão sendo
 * lançados (nunca fica presa analisando só o 1º bimestre). O texto nunca é
 * fixo: cada frase é gerada a partir dos números reais de "executivo".
 */
export function gerarObservacoes(executivo: ExecutivoResult): string[] {
  const { snapshotAtual, snapshotAnterior, bimestresComDados, rankingTurmas, rankingDisciplinasFundamental, rankingDisciplinasMedio } = executivo;
  const observacoes: string[] = [];
  const n = bimestresComDados.length;

  if (n === 0 || snapshotAtual.media === null) {
    return ["Ainda não há notas lançadas neste ano letivo."];
  }

  const rankingDisciplinas = [...rankingDisciplinasFundamental, ...rankingDisciplinasMedio];
  const melhorTurma = [...rankingTurmas].sort((a, b) => (b.media ?? 0) - (a.media ?? 0))[0];
  const piorTurma = [...rankingTurmas].sort((a, b) => (a.media ?? 10) - (b.media ?? 10))[0];
  const piorDisciplina = [...rankingDisciplinas].sort((a, b) => (a.media ?? 10) - (b.media ?? 10))[0];

  if (n === 1) {
    // Só o 1º bimestre — descreve o estado atual, sem comparação.
    observacoes.push(
      `A escola está no ${snapshotAtual.label.toLowerCase()}, com média geral de ${snapshotAtual.media.toFixed(1)}.`
    );
    if (melhorTurma) {
      observacoes.push(`${melhorTurma.nome} é a turma com melhor desempenho até agora (média ${melhorTurma.media?.toFixed(1)}).`);
    }
    if (piorDisciplina && (piorDisciplina.media ?? 10) < 6) {
      observacoes.push(`${piorDisciplina.nome} é a disciplina com maior índice de dificuldade (média ${piorDisciplina.media?.toFixed(1)}).`);
    }
    if (executivo.alunosCriticosGeral > 0) {
      observacoes.push(
        `${executivo.alunosCriticosGeral} aluno${executivo.alunosCriticosGeral !== 1 ? "s estão" : " está"} pré-reprovado${executivo.alunosCriticosGeral !== 1 ? "s" : ""} (3 ou mais disciplinas em risco).`
      );
    }
    return observacoes;
  }

  // 2 ou 3 bimestres com dados — evolução em relação ao bimestre anterior.
  if (n < 4) {
    if (snapshotAnterior?.media !== null && snapshotAnterior?.media !== undefined) {
      const delta = Number((snapshotAtual.media - snapshotAnterior.media).toFixed(1));
      if (Math.abs(delta) < 0.05) {
        observacoes.push(`A média geral manteve-se estável em relação ao ${snapshotAnterior.label.toLowerCase()} (${snapshotAtual.media.toFixed(1)}).`);
      } else {
        observacoes.push(
          `A média geral ${delta > 0 ? "cresceu" : "caiu"} ${Math.abs(delta).toFixed(1)} ponto${Math.abs(delta) !== 1 ? "s" : ""} em relação ao ${snapshotAnterior.label.toLowerCase()}.`
        );
      }
    }

    if (executivo.entraramNaAtencao > 0 || executivo.sairamDaAtencao > 0) {
      const partes: string[] = [];
      if (executivo.sairamDaAtencao > 0) partes.push(`${executivo.sairamDaAtencao} saíram da zona de atenção`);
      if (executivo.entraramNaAtencao > 0) partes.push(`${executivo.entraramNaAtencao} entraram`);
      observacoes.push(`Desde o bimestre anterior, ${partes.join(" e ")}.`);
    }

    const turmaConsistente = [...rankingTurmas]
      .filter((t) => t.evolucao !== null && t.evolucao > 0 && t.deltaUltimoBimestre !== null && t.deltaUltimoBimestre > 0)
      .sort((a, b) => (b.evolucao ?? 0) - (a.evolucao ?? 0))[0];
    if (turmaConsistente) {
      observacoes.push(`${turmaConsistente.nome} mantém tendência de crescimento consistente desde o início do ano.`);
    }

    const disciplinaEmQueda = [...rankingDisciplinas]
      .filter((d) => d.deltaUltimoBimestre !== null && d.deltaUltimoBimestre < -0.1 && d.evolucao !== null && d.evolucao < 0)
      .sort((a, b) => (a.deltaUltimoBimestre ?? 0) - (b.deltaUltimoBimestre ?? 0))[0];
    if (disciplinaEmQueda) {
      observacoes.push(`${disciplinaEmQueda.nome} apresentou queda pelo segundo bimestre consecutivo.`);
    }

    if (piorTurma && piorTurma.media !== null && piorTurma.media < 6) {
      observacoes.push(`${piorTurma.nome} necessita de atenção pedagógica (média ${piorTurma.media.toFixed(1)}).`);
    }

    return observacoes;
  }

  // 4 bimestres com dados — ano fechado, análise anual completa.
  const primeiroSnapshot = executivo.snapshots.find((s) => s.temDados);
  if (primeiroSnapshot && primeiroSnapshot.media !== null) {
    const deltaAnual = Number((snapshotAtual.media - primeiroSnapshot.media).toFixed(1));
    observacoes.push(
      `Ao longo do ano, a média geral ${deltaAnual >= 0 ? "evoluiu" : "caiu"} de ${primeiroSnapshot.media.toFixed(1)} (${primeiroSnapshot.label}) para ${snapshotAtual.media.toFixed(1)} (${snapshotAtual.label}), uma variação de ${deltaAnual >= 0 ? "+" : ""}${deltaAnual.toFixed(1)} ponto${Math.abs(deltaAnual) !== 1 ? "s" : ""}.`
    );
  }
  if (melhorTurma) {
    observacoes.push(`${melhorTurma.nome} fecha o ano como a turma de melhor desempenho (média ${melhorTurma.media?.toFixed(1)}).`);
  }
  observacoes.push(
    `${executivo.alunosCriticosGeral} aluno${executivo.alunosCriticosGeral !== 1 ? "s" : ""} ${executivo.alunosCriticosGeral !== 1 ? "terminam" : "termina"} o ano em situação de pré-reprovação (3+ disciplinas em risco) e ${executivo.alunosAtencaoGeral} em zona de atenção (1-2 disciplinas).`
  );
  if (piorDisciplina) {
    observacoes.push(`${piorDisciplina.nome} foi a disciplina com maior índice de dificuldade no ano (média ${piorDisciplina.media?.toFixed(1)}).`);
  }

  return observacoes;
}
