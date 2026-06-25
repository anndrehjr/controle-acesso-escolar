import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "./types";

export type DisciplinaAlertaItem = {
  disciplinaId: string;
  disciplinaNome: string;
  codigo: string;
  nota: number;
};

export type AlunoAlertaItem = {
  alunoId: string;
  nome: string;
  numeroChamada: number;
  turmaId: string;
  turmaNome: string;
  mediaGeral: number | null;
  totalDisciplinasAbaixo: number;
  status: "critico" | "atencao";
  disciplinasAbaixo: DisciplinaAlertaItem[];
};

type Params = {
  alunos: Aluno[];
  notas: Nota[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  matriz: MatrizDisciplina[];
};

// 4+ disciplinas < 5,0 → crítico
// 2–3 disciplinas < 5,0 → atenção
// 0–1 disciplina < 5,0  → não aparece
export function buildAlertas({
  alunos,
  notas,
  turmas,
  disciplinas,
  matriz,
}: Params): {
  criticos: AlunoAlertaItem[];
  atencao: AlunoAlertaItem[];
  abaixoBasico: number;
  total: number;
} {
  const turmaMap = new Map(turmas.map((t) => [t.id, t]));
  const criticos: AlunoAlertaItem[] = [];
  const atencao: AlunoAlertaItem[] = [];
  let abaixoBasico = 0;

  for (const aluno of alunos) {
    if (aluno.status === "TRANSFERIDO" || !aluno.ativo) continue;

    const turma = turmaMap.get(aluno.turma_id);
    if (!turma) continue;

    const grupo = turma.grupo_pedagogico;

    const matrizDaTurma = matriz
      .filter((m) => {
        const etapa = String(m.etapa ?? "").trim().toUpperCase();
        const grp = String(grupo ?? "").trim().toUpperCase();
        return etapa === grp;
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
      .filter((item): item is { id: string; nome: string; codigo: string } => item !== null);

    const notasAluno = notas.filter(
      (n) => n.aluno_id === aluno.id && n.turma_id === aluno.turma_id
    );

    const disciplinasAbaixo: DisciplinaAlertaItem[] = [];
    const notasValidas: number[] = [];

    for (const disciplina of disciplinasDaTurma) {
      const notaEntry = notasAluno
        .filter((n) => String(n.disciplina_id).trim() === String(disciplina.id).trim())
        .at(-1);
      if (notaEntry?.nota == null) continue;
      const nota = Number(notaEntry.nota);
      notasValidas.push(nota);
      if (nota < 5) {
        disciplinasAbaixo.push({
          disciplinaId: disciplina.id,
          disciplinaNome: disciplina.nome,
          codigo: disciplina.codigo,
          nota,
        });
      }
    }

    const count = disciplinasAbaixo.length;
    if (count >= 1) abaixoBasico++;
    if (count < 2) continue;

    const mediaGeral =
      notasValidas.length > 0
        ? notasValidas.reduce((acc, n) => acc + n, 0) / notasValidas.length
        : null;

    const item: AlunoAlertaItem = {
      alunoId: aluno.id,
      nome: aluno.nome,
      numeroChamada: aluno.numero_chamada,
      turmaId: turma.id,
      turmaNome: turma.nome,
      mediaGeral,
      totalDisciplinasAbaixo: count,
      status: count >= 4 ? "critico" : "atencao",
      disciplinasAbaixo: disciplinasAbaixo.sort((a, b) => a.nota - b.nota),
    };

    if (count >= 4) {
      criticos.push(item);
    } else {
      atencao.push(item);
    }
  }

  const sortFn = (a: AlunoAlertaItem, b: AlunoAlertaItem) => {
    if (b.totalDisciplinasAbaixo !== a.totalDisciplinasAbaixo)
      return b.totalDisciplinasAbaixo - a.totalDisciplinasAbaixo;
    return (a.mediaGeral ?? 10) - (b.mediaGeral ?? 10);
  };

  criticos.sort(sortFn);
  atencao.sort(sortFn);

  return { criticos, atencao, abaixoBasico, total: criticos.length + atencao.length };
}
