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
  return turmas.map((turma) => {
    const grupo = turma.grupo_pedagogico;

    const matrizDaTurma = matriz
      .filter((m) => {
        const etapaMatriz = String(m.etapa ?? "").trim().toUpperCase();
        const grupoTurma = String(grupo ?? "").trim().toUpperCase();
        return etapaMatriz === grupoTurma;
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo));

    const disciplinasDaTurma = matrizDaTurma
      .map((m) => {
        const disciplina = disciplinas.find(
          (d) => String(d.id).trim() === String(m.disciplina_id).trim()
        );
        if (!disciplina) return null;
        return { id: disciplina.id, nome: disciplina.nome, codigo: m.codigo };
      })
      .filter(
        (item): item is { id: string; nome: string; codigo: string } =>
          item !== null
      );

    const alunosDaTurma = alunos
      .filter((a) => a.turma_id === turma.id && a.status !== "TRANSFERIDO")
      .sort((a, b) => a.nome.localeCompare(b.nome));

    const linhas = alunosDaTurma.map((aluno) => {
      const notasAluno = notas.filter(
        (n) => n.aluno_id === aluno.id && n.turma_id === turma.id
      );

      const disciplinasComNotas = disciplinasDaTurma.map((disciplina) => {
        const notasDaDisciplina = notasAluno.filter(
          (n) => String(n.disciplina_id).trim() === String(disciplina.id).trim()
        );
        const nota = notasDaDisciplina.at(-1);

        return {
          disciplinaId: disciplina.id,
          disciplinaNome: disciplina.nome,
          codigo: disciplina.codigo,
          nota:
            nota?.nota !== null && nota?.nota !== undefined
              ? Number(nota.nota)
              : null,
        };
      });

      const notasValidas = disciplinasComNotas
        .map((d) => d.nota)
        .filter((n): n is number => n !== null);

      const media =
        notasValidas.length > 0
          ? notasValidas.reduce((acc, n) => acc + n, 0) / notasValidas.length
          : null;

      return {
        alunoId: aluno.id,
        nome: aluno.nome,
        numeroChamada: aluno.numero_chamada,
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
