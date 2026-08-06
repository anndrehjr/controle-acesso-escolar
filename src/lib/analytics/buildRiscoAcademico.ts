import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "./types";

// Fallback: infer grupo_pedagogico from turma name when the field is null/empty
function inferirGrupo(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("série") || n.includes("serie") || n.includes("médio") || n.includes("medio")) return "EM";
  if (n.includes("ano") || n.includes("fundamental")) return "EF";
  return "";
}

const TOTAL_BIMESTRES = 4;
const SOMA_APROVACAO = 20; // soma dos 4 bimestres necessária para aprovar direto (equivale a média 5)
const MARGEM_CONSELHO = 3; // pontos faltando para 20, no fechamento do 4º bimestre, que ainda vão a conselho em vez de reprovar direto

export type DisciplinaRiscoItem = {
  disciplinaId: string;
  disciplinaNome: string;
  codigo: string;
  /** Média atual da disciplina (soma dos bimestres lançados ÷ nº de bimestres lançados) */
  nota: number;
  /** true só no fechamento do 4º bimestre: não bateu os 20 pontos, mas ficou perto (dentro da margem de conselho) */
  emConselho: boolean;
};

export type AlunoRiscoItem = {
  alunoId: string;
  nome: string;
  numeroChamada: number;
  turmaId: string;
  turmaNome: string;
  mediaGeral: number | null;
  totalDisciplinasRisco: number;
  /** 3+ disciplinas em pré-reprovado/conselho simultaneamente */
  status: "critico" | "atencao";
  disciplinas: DisciplinaRiscoItem[];
};

type Params = {
  alunos: Aluno[];
  /** Notas de TODOS os bimestres já lançados no ano letivo (1..bimestreAtual) — não filtrar para um bimestre só */
  notas: Nota[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  matriz: MatrizDisciplina[];
};

/**
 * Risco acadêmico anual (não é mais um snapshot de um bimestre isolado):
 *
 * Por disciplina — o "fechamento" é decidido por disciplina, não pelo contador de bimestre da
 * escola: só quando as 4 notas daquela disciplina já foram lançadas para aquele aluno é que
 * fazemos a conta final (soma < 20 → reprovado, ou conselho se ficou perto). Enquanto a
 * disciplina ainda não tem os 4 lançamentos, o risco é por ritmo: "pré-reprovado" quando a
 * média atual (soma lançada ÷ bimestres lançados) está abaixo de 5.
 *
 * Por aluno — 3 ou mais disciplinas em risco ao mesmo tempo = "crítico" (é esse aluno que vai
 * para o conselho de classe). 1 ou 2 disciplinas = "atenção". 0 = não aparece.
 */
export function buildRiscoAcademico({
  alunos,
  notas,
  turmas,
  disciplinas,
  matriz,
}: Params): {
  criticos: AlunoRiscoItem[];
  atencao: AlunoRiscoItem[];
  abaixoBasico: number;
  total: number;
} {
  const turmaMap = new Map(turmas.map((t) => [t.id, t]));
  const criticos: AlunoRiscoItem[] = [];
  const atencao: AlunoRiscoItem[] = [];

  for (const aluno of alunos) {
    if (aluno.status === "TRANSFERIDO" || !aluno.ativo) continue;

    const turma = turmaMap.get(aluno.turma_id);
    if (!turma) continue;

    const grpRaw = String(turma.grupo_pedagogico ?? "").trim().toUpperCase();
    const grupo = grpRaw || inferirGrupo(turma.nome);

    const matrizDaTurma = matriz
      .filter((m) => String(m.etapa ?? "").trim().toUpperCase() === grupo)
      .sort((a, b) => a.codigo.localeCompare(b.codigo));

    const disciplinasDaTurma = matrizDaTurma
      .map((m) => {
        const d = disciplinas.find((d) => String(d.id).trim() === String(m.disciplina_id).trim());
        if (!d) return null;
        return { id: d.id, nome: d.nome, codigo: m.codigo };
      })
      .filter((item): item is { id: string; nome: string; codigo: string } => item !== null);

    const notasAluno = notas.filter((n) => n.aluno_id === aluno.id && n.turma_id === aluno.turma_id);

    const disciplinasRisco: DisciplinaRiscoItem[] = [];
    const mediasValidas: number[] = [];

    for (const disciplina of disciplinasDaTurma) {
      const notasDaDisciplina = notasAluno
        .filter((n) => String(n.disciplina_id).trim() === String(disciplina.id).trim() && n.nota != null)
        .map((n) => Number(n.nota));

      if (notasDaDisciplina.length === 0) continue;

      const soma = notasDaDisciplina.reduce((acc, n) => acc + n, 0);
      const bimestresLancados = notasDaDisciplina.length;
      const mediaAtual = soma / bimestresLancados;
      mediasValidas.push(mediaAtual);

      let emRisco = false;
      let emConselho = false;

      if (bimestresLancados >= TOTAL_BIMESTRES) {
        // as 4 notas dessa disciplina já existem — dá pra fechar de verdade, não é mais projeção
        if (soma < SOMA_APROVACAO) {
          emRisco = true;
          if (soma >= SOMA_APROVACAO - MARGEM_CONSELHO) emConselho = true;
        }
      } else if (mediaAtual < 5) {
        emRisco = true;
      }

      if (emRisco) {
        disciplinasRisco.push({
          disciplinaId: disciplina.id,
          disciplinaNome: disciplina.nome,
          codigo: disciplina.codigo,
          nota: Number(mediaAtual.toFixed(2)),
          emConselho,
        });
      }
    }

    const count = disciplinasRisco.length;
    if (count < 1) continue;

    const mediaGeral =
      mediasValidas.length > 0
        ? mediasValidas.reduce((acc, n) => acc + n, 0) / mediasValidas.length
        : null;

    const item: AlunoRiscoItem = {
      alunoId: aluno.id,
      nome: aluno.nome,
      numeroChamada: aluno.numero_chamada,
      turmaId: turma.id,
      turmaNome: turma.nome,
      mediaGeral,
      totalDisciplinasRisco: count,
      status: count >= 3 ? "critico" : "atencao",
      disciplinas: disciplinasRisco.sort((a, b) => a.nota - b.nota),
    };

    if (count >= 3) {
      criticos.push(item);
    } else {
      atencao.push(item);
    }
  }

  const sortFn = (a: AlunoRiscoItem, b: AlunoRiscoItem) => {
    if (b.totalDisciplinasRisco !== a.totalDisciplinasRisco)
      return b.totalDisciplinasRisco - a.totalDisciplinasRisco;
    return (a.mediaGeral ?? 10) - (b.mediaGeral ?? 10);
  };

  criticos.sort(sortFn);
  atencao.sort(sortFn);

  return {
    criticos,
    atencao,
    abaixoBasico: criticos.length + atencao.length,
    total: criticos.length + atencao.length,
  };
}
