import type {
  Aluno,
  Nota,
  Turma,
} from "./types";

type Params = {
  alunos: Aluno[];
  notas: Nota[];
  turmas: Turma[];
};

export function buildDistribuicaoPedagogica({
  alunos,
  notas,
  turmas,
}: Params) {
  const distribuicaoPorTurma = turmas.map((turma) => {
    const alunosTurma = alunos.filter(
      (a) =>
        a.turma_id === turma.id &&
        a.status !== "TRANSFERIDO"
    );

    const idsAlunos = alunosTurma.map((a) => a.id);

    const notasTurma = notas.filter(
      (n) =>
        idsAlunos.includes(n.aluno_id) &&
        n.nota !== null
    );

    const mediasPorAluno = idsAlunos.map((alunoId) => {
      const notasAluno = notasTurma.filter(
        (n) => n.aluno_id === alunoId
      );

      if (notasAluno.length === 0) return null;

      const media =
        notasAluno.reduce(
          (acc, n) => acc + Number(n.nota),
          0
        ) / notasAluno.length;

      return media;
    });

    const mediasValidas = mediasPorAluno.filter(
      (m): m is number => m !== null
    );

    const critico = mediasValidas.filter(
      (m) => m <= 4
    ).length;

    const basico = mediasValidas.filter(
      (m) => m > 4 && m <= 6
    ).length;

    const adequado = mediasValidas.filter(
      (m) => m > 6 && m <= 8
    ).length;

    const avancado = mediasValidas.filter(
      (m) => m > 8
    ).length;

    return {
      turma: turma.nome,
      critico,
      basico,
      adequado,
      avancado,
    };
  });

  const distribuicaoGeral = {
    critico: distribuicaoPorTurma.reduce(
      (acc, t) => acc + t.critico,
      0
    ),

    basico: distribuicaoPorTurma.reduce(
      (acc, t) => acc + t.basico,
      0
    ),

    adequado: distribuicaoPorTurma.reduce(
      (acc, t) => acc + t.adequado,
      0
    ),

    avancado: distribuicaoPorTurma.reduce(
      (acc, t) => acc + t.avancado,
      0
    ),
  };

  return {
    distribuicaoPorTurma,
    distribuicaoGeral,
  };
}