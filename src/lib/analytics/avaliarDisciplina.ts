/**
 * Serviço central de avaliação de risco acadêmico. TODA tela que precisa saber
 * se uma disciplina está em risco, ou se um aluno está pré-reprovado, deve
 * passar pelas funções daqui — nunca duplicar esses limiares em outro lugar.
 *
 * Regra confirmada com o usuário:
 * - Disciplina em risco: média das notas já lançadas < 5,0. Nunca usar a nota
 *   de um bimestre isolado — sempre a média acumulada dos bimestres lançados.
 * - No fechamento (quando as 4 notas do ano já existem), o critério muda de
 *   "média" pra "soma dos 4 bimestres": abaixo de 20 pontos é reprovado, mas
 *   se ficar dentro de 3 pontos de 20 vai a conselho em vez de reprovar direto
 *   (regra definida com o usuário durante a implementação da feature).
 * - Aluno pré-reprovado (antes chamado só de "crítico"): 3 ou mais disciplinas
 *   em risco ao mesmo tempo. 1 ou 2 disciplinas = "atenção".
 */

export const TOTAL_BIMESTRES = 4;
export const SOMA_APROVACAO = 20; // soma dos 4 bimestres necessária pra aprovar direto (equivale a média 5)
export const MARGEM_CONSELHO = 3; // pontos faltando pra 20, no fechamento, que ainda vão a conselho em vez de reprovar direto
export const LIMITE_PRE_REPROVADO = 3; // disciplinas em risco simultâneas que classificam o aluno como pré-reprovado

export type AvaliacaoDisciplina = {
  /** Média das notas lançadas (null se nenhuma nota ainda) */
  media: number | null;
  /** Quantos bimestres dessa disciplina já têm nota lançada */
  bimestresLancados: number;
  /** true quando a disciplina está em risco (pela média acumulada, nunca por nota isolada) */
  emRisco: boolean;
  /** true só no fechamento (4 notas lançadas): não bateu a soma mínima, mas ficou perto o bastante pra ir a conselho */
  emConselho: boolean;
};

/**
 * Avalia uma disciplina a partir das notas já lançadas (1 a 4 valores, um por
 * bimestre). Sempre usa a média acumulada — nunca a nota de um bimestre
 * isolado — exceto no fechamento com as 4 notas, onde o critério de
 * aprovação é a soma total.
 */
export function avaliarDisciplina(notas: (number | null | undefined)[]): AvaliacaoDisciplina {
  const validas = notas.filter(
    (n): n is number => n !== null && n !== undefined && !Number.isNaN(n)
  );
  const bimestresLancados = validas.length;

  if (bimestresLancados === 0) {
    return { media: null, bimestresLancados: 0, emRisco: false, emConselho: false };
  }

  const soma = validas.reduce((acc, n) => acc + n, 0);
  const media = soma / bimestresLancados;

  let emRisco = false;
  let emConselho = false;

  if (bimestresLancados >= TOTAL_BIMESTRES) {
    if (soma < SOMA_APROVACAO) {
      emRisco = true;
      if (soma >= SOMA_APROVACAO - MARGEM_CONSELHO) emConselho = true;
    }
  } else if (media < 5) {
    emRisco = true;
  }

  return { media, bimestresLancados, emRisco, emConselho };
}

/**
 * Classifica o aluno a partir de quantas disciplinas estão em risco.
 * "critico" é o identificador interno já usado em todo o código — na
 * interface ele é sempre mostrado como "Pré-Reprovado" pro usuário.
 */
export function statusAlunoPorRisco(totalDisciplinasRisco: number): "critico" | "atencao" | "ok" {
  if (totalDisciplinasRisco >= LIMITE_PRE_REPROVADO) return "critico";
  if (totalDisciplinasRisco >= 1) return "atencao";
  return "ok";
}
