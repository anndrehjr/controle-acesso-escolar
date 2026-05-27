import type {
  Aluno,
  Disciplina,
  MatrizDisciplina,
  Nota,
  Turma,
} from "./types";

type Params = {
  alunos: Aluno[];
  notas: Nota[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  matriz: MatrizDisciplina[];
};

export function buildHeatmapPedagogico({
  alunos,
  notas,
  turmas,
  disciplinas,
  matriz = [],
}: Params) {
  console.log("========== DEBUG HEATMAP ==========");

  return turmas.map((turma) => {
    const grupo = turma.grupo_pedagogico;

    console.log(" ");
    console.log("==================================");
    console.log("TURMA:", turma.nome);
    console.log("GRUPO ORIGINAL:", grupo);

    /*
      MATRIZ DA TURMA
    */

    const matrizDaTurma = matriz
      .filter((m) => {
        const etapaMatriz = String(m.etapa || "")
          .trim()
          .toUpperCase();

        const grupoTurma = String(grupo || "")
          .trim()
          .toUpperCase();

        return etapaMatriz === grupoTurma;
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo));

    console.log(
      "MATRIZES DISPONÍVEIS:",
      matriz.map((m) => m.etapa)
    );

    console.log("MATRIZ DA TURMA:");
    console.log(matrizDaTurma);

    /*
      DISCIPLINAS DA TURMA
    */

    const disciplinasDaTurma = matrizDaTurma
      .map((m) => {
        const disciplina = disciplinas.find(
          (d) =>
            String(d.id).trim() ===
            String(m.disciplina_id).trim()
        );

        if (!disciplina) {
          console.log(
            "❌ DISCIPLINA NÃO ENCONTRADA:",
            m.disciplina_id
          );

          return null;
        }

        return {
          id: disciplina.id,
          nome: disciplina.nome,
          codigo: m.codigo,
        };
      })
      .filter(
        (
          item
        ): item is {
          id: string;
          nome: string;
          codigo: string;
        } => item !== null
      );

    console.log("DISCIPLINAS DA TURMA:");
    console.log(disciplinasDaTurma);

    /*
      ALUNOS DA TURMA
    */

    const alunosDaTurma = alunos
      .filter(
        (aluno) =>
          aluno.turma_id === turma.id &&
          aluno.status !== "TRANSFERIDO"
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));

    /*
      LINHAS DO HEATMAP
    */

    const linhas = alunosDaTurma.map((aluno) => {
      const notasAluno = notas.filter(
        (nota) =>
          nota.aluno_id === aluno.id &&
          nota.turma_id === turma.id
      );

      console.log(" ");
      console.log("👤 ALUNO:", aluno.nome);
      console.log(
        "NOTAS ENCONTRADAS:",
        notasAluno.length
      );

      /*
        DISCIPLINAS COM NOTAS
      */

      const disciplinasComNotas = disciplinasDaTurma.map(
        (disciplina) => {
          const notasDaDisciplina = notasAluno.filter(
            (n) =>
              String(n.disciplina_id).trim() ===
              String(disciplina.id).trim()
          );

          const nota = notasDaDisciplina.at(-1);

          console.log(
            "DISCIPLINA:",
            disciplina.nome,
            "| NOTAS:",
            notasDaDisciplina
          );

          return {
            disciplinaId: disciplina.id,
            disciplinaNome: disciplina.nome,
            codigo: disciplina.codigo,
            nota:
              nota?.nota !== null &&
              nota?.nota !== undefined
                ? Number(nota.nota)
                : null,
          };
        }
      );

      console.log(
        "DISCIPLINAS COM NOTAS:"
      );

      console.log(disciplinasComNotas);

      /*
        MÉDIA
      */

      const notasValidas = disciplinasComNotas
        .map((d) => d.nota)
        .filter(
          (nota): nota is number =>
            nota !== null
        );

      const media =
        notasValidas.length > 0
          ? notasValidas.reduce(
              (acc, nota) => acc + nota,
              0
            ) / notasValidas.length
          : null;

      console.log("MÉDIA:", media);

      return {
        alunoId: aluno.id,
        nome: aluno.nome,
        emAtencao: aluno.em_atencao,
        media,
        disciplinas: disciplinasComNotas,
      };
    });

    return {
      turmaId: turma.id,
      turmaNome: turma.nome,
      grupoPedagogico: grupo,
      disciplinas: disciplinasDaTurma,
      alunos: linhas,
    };
  });
}
