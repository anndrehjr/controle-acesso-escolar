import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "./types";

export type DisciplinaRisco = {
  disciplinaId: string;
  disciplinaNome: string;
  codigo: string;
  nota: number;
};

export type AlunoRisco = {
  alunoId: string;
  nome: string;
  numeroChamada: number;
  turmaId: string;
  turmaNome: string;
  mediaGeral: number | null;
  totalDisciplinasRisco: number;
  disciplinasRisco: DisciplinaRisco[];
};

type Params = {
  alunos: Aluno[];
  notas: Nota[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  matriz: MatrizDisciplina[];
};

export function buildAlunosRisco({
  alunos,
  notas,
  turmas,
  disciplinas,
  matriz,
}: Params): { alunosRisco: AlunoRisco[]; total: number } {
  const turmaMap = new Map(turmas.map((t) => [t.id, t]));
  const alunosRisco: AlunoRisco[] = [];

  for (const aluno of alunos) {
    if (aluno.status === "TRANSFERIDO" || !aluno.ativo) continue;

    const turma = turmaMap.get(aluno.turma_id);
    if (!turma) continue;

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
        const d = disciplinas.find(
          (d) => String(d.id).trim() === String(m.disciplina_id).trim()
        );
        if (!d) return null;
        return { id: d.id, nome: d.nome, codigo: m.codigo };
      })
      .filter(
        (item): item is { id: string; nome: string; codigo: string } => item !== null
      );

    const notasAluno = notas.filter(
      (n) => n.aluno_id === aluno.id && n.turma_id === aluno.turma_id
    );

    const disciplinasRisco: DisciplinaRisco[] = [];
    const notasValidas: number[] = [];

    for (const disciplina of disciplinasDaTurma) {
      const notasDaDisciplina = notasAluno.filter(
        (n) => String(n.disciplina_id).trim() === String(disciplina.id).trim()
      );
      const notaEntry = notasDaDisciplina.at(-1);
      if (notaEntry?.nota == null) continue;
      const nota = Number(notaEntry.nota);
      notasValidas.push(nota);
      if (nota < 5) {
        disciplinasRisco.push({
          disciplinaId: disciplina.id,
          disciplinaNome: disciplina.nome,
          codigo: disciplina.codigo,
          nota,
        });
      }
    }

    if (disciplinasRisco.length >= 2) {
      const mediaGeral =
        notasValidas.length > 0
          ? notasValidas.reduce((acc, n) => acc + n, 0) / notasValidas.length
          : null;

      alunosRisco.push({
        alunoId: aluno.id,
        nome: aluno.nome,
        numeroChamada: aluno.numero_chamada,
        turmaId: turma.id,
        turmaNome: turma.nome,
        mediaGeral,
        totalDisciplinasRisco: disciplinasRisco.length,
        disciplinasRisco: disciplinasRisco.sort((a, b) => a.nota - b.nota),
      });
    }
  }

  // Mais disciplinas em risco primeiro; em empate, menor média primeiro
  alunosRisco.sort((a, b) => {
    if (b.totalDisciplinasRisco !== a.totalDisciplinasRisco) {
      return b.totalDisciplinasRisco - a.totalDisciplinasRisco;
    }
    return (a.mediaGeral ?? 10) - (b.mediaGeral ?? 10);
  });

  return { alunosRisco, total: alunosRisco.length };
}
