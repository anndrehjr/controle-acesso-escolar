import type { Aluno, Disciplina, Nota, Turma } from "./types";

function getNivel(media: number) {
  if (media < 5) return "critico";
  if (media < 7) return "basico";
  if (media < 9) return "adequado";
  return "avancado";
}

type Props = {
  alunos: Aluno[];
  notas: Nota[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  bimestre?: number;
  anoLetivo?: number;
};

export function buildSchoolDashboard({
  alunos,
  notas,
  turmas,
  disciplinas,
  bimestre,
  anoLetivo,
}: Props) {
  const alunosAtivos = alunos.filter(
    (aluno) => aluno.status !== "TRANSFERIDO"
  );

  const alunosTransferidos = alunos.filter(
    (aluno) => aluno.status === "TRANSFERIDO"
  );

  const idsAlunosAtivos = new Set(alunosAtivos.map((aluno) => aluno.id));

  const notasValidas = notas.filter((nota) => {
    const notaNumerica = Number(nota.nota);

    const notaValida =
      nota.nota !== null &&
      nota.nota !== undefined &&
      !Number.isNaN(notaNumerica);

    const alunoAtivo = idsAlunosAtivos.has(nota.aluno_id);

    const mesmoBimestre =
      bimestre === undefined || Number(nota.bimestre) === Number(bimestre);

    const mesmoAnoLetivo =
      anoLetivo === undefined || Number(nota.ano_letivo) === Number(anoLetivo);

    return notaValida && alunoAtivo && mesmoBimestre && mesmoAnoLetivo;
  });

  const mediaGeral =
    notasValidas.length > 0
      ? notasValidas.reduce((acc, nota) => acc + Number(nota.nota), 0) /
        notasValidas.length
      : 0;

  const mediasPorAluno = alunosAtivos.map((aluno) => {
    const notasAluno = notasValidas.filter(
      (nota) => nota.aluno_id === aluno.id
    );

    if (notasAluno.length === 0) {
      return {
        aluno,
        media: null,
        totalNotas: 0,
        nivel: "sem_nota",
      };
    }

    const media =
      notasAluno.reduce((acc, nota) => acc + Number(nota.nota), 0) /
      notasAluno.length;

    return {
      aluno,
      media,
      totalNotas: notasAluno.length,
      nivel: getNivel(media),
    };
  });

  const alunosComNota = mediasPorAluno.filter((item) => item.media !== null);

  const alunosSemNota = mediasPorAluno.filter((item) => item.media === null);

  const alunosCriticos = alunosComNota.filter(
    (item) => item.nivel === "critico"
  );

  const alunosAdequadosOuAvancados = alunosComNota.filter(
    (item) => item.nivel === "adequado" || item.nivel === "avancado"
  );

  const percentualAdequado =
    alunosComNota.length > 0
      ? (alunosAdequadosOuAvancados.length / alunosComNota.length) * 100
      : 0;

  // ⚠️6 fix: derive from grades (faixa básico 5,0–6,9) instead of manual em_atencao flag
  const alunosAtencao = alunosComNota.filter((item) => item.nivel === "basico").length;

  const rankingTurmas = turmas
    .map((turma) => {
      const alunosDaTurma = alunosAtivos.filter(
        (aluno) => aluno.turma_id === turma.id
      );

      const idsDaTurma = new Set(alunosDaTurma.map((aluno) => aluno.id));

      const notasTurma = notasValidas.filter((nota) =>
        idsDaTurma.has(nota.aluno_id)
      );

      const media =
        notasTurma.length > 0
          ? notasTurma.reduce((acc, nota) => acc + Number(nota.nota), 0) /
            notasTurma.length
          : 0;

      return {
        turma,
        media,
        totalNotas: notasTurma.length,
      };
    })
    .sort((a, b) => b.media - a.media);

  function calcularDisciplinasCriticas(tipo: "geral" | "fundamental" | "medio") {
    return disciplinas
      .map((disciplina) => {
        const notasDisciplina = notasValidas.filter((nota) => {
          if (nota.disciplina_id !== disciplina.id) return false;

          const turma = turmas.find((t) => t.id === nota.turma_id);

          if (!turma) return false;

          // ⚠️7 fix: use grupo_pedagogico when available, fall back to name matching
          const grp = String(turma.grupo_pedagogico ?? "").trim().toUpperCase();
          const nomeTurma = turma.nome.toLowerCase();

          const ehFundamental =
            grp.startsWith("EF") || grp === "FUNDAMENTAL" ||
            nomeTurma.includes("ano") || nomeTurma.includes("fundamental");

          const ehMedio =
            grp.startsWith("EM") || grp === "MEDIO" || grp === "MÉDIO" ||
            nomeTurma.includes("série") ||
            nomeTurma.includes("serie") ||
            nomeTurma.includes("médio") ||
            nomeTurma.includes("medio");

          if (tipo === "fundamental") return ehFundamental;
          if (tipo === "medio") return ehMedio;

          return true;
        });

        const notasBaixas = notasDisciplina.filter(
          (nota) => Number(nota.nota) < 5
        );

        const percentual =
          notasDisciplina.length > 0
            ? (notasBaixas.length / notasDisciplina.length) * 100
            : 0;

        return {
          disciplina,
          percentual,
          totalCritico: notasBaixas.length,
          totalNotas: notasDisciplina.length,
        };
      })
      .filter((item) => item.totalNotas > 0)
      .sort((a, b) => b.percentual - a.percentual);
  }

  const disciplinasCriticasGeral = calcularDisciplinasCriticas("geral");

  const disciplinasCriticasFundamental =
    calcularDisciplinasCriticas("fundamental");

  const disciplinasCriticasMedio = calcularDisciplinasCriticas("medio");

  const alunosPorMediaDesc = [...alunosComNota].sort(
    (a, b) => (b.media ?? 0) - (a.media ?? 0)
  );
  const alunosPorMediaAsc = [...alunosComNota].sort(
    (a, b) => (a.media ?? 10) - (b.media ?? 10)
  );

  const melhorAlunoDaTurma = alunosPorMediaDesc[0] ?? null;
  const pioresAlunosDaTurma = alunosPorMediaAsc.slice(0, 3);

  return {
    alunosAtivos,
    alunosTransferidos,
    alunosComNota,
    alunosSemNota,
    notasValidas,
    mediaGeral,
    mediasPorAluno,
    alunosCriticos,
    alunosAdequadosOuAvancados,
    percentualAdequado,
    alunosAtencao,
    rankingTurmas,
    melhorTurma: rankingTurmas[0],
    turmaAlerta: rankingTurmas[rankingTurmas.length - 1],
    melhorAlunoDaTurma,
    pioresAlunosDaTurma,

    disciplinasCriticas: disciplinasCriticasGeral,
    disciplinasCriticasGeral,
    disciplinasCriticasFundamental,
    disciplinasCriticasMedio,
    disciplinaMaisCritica: disciplinasCriticasGeral[0],
  };
}