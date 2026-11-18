export const TIPOS_AVALIACAO = ["ATIVIDADE", "PROVA", "TRABALHO", "SIMULADO", "OUTRA"] as const;
export const CRITERIOS_RECUPERACAO = ["MAIOR_NOTA", "MEDIA_ARITMETICA", "SUBSTITUICAO"] as const;
export const TIPOS_RECUPERACAO = ["PARALELA", "BIMESTRAL", "FINAL"] as const;

export type TipoAvaliacao = (typeof TIPOS_AVALIACAO)[number];
export type CriterioRecuperacao = (typeof CRITERIOS_RECUPERACAO)[number];
export type TipoRecuperacao = (typeof TIPOS_RECUPERACAO)[number];

export type ParcelaAvaliacao = {
  nota: number;
  notaMaxima: number;
  peso: number;
};

function numeroEntre(value: unknown, minimo: number, maximo: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimo && value <= maximo;
}

export function calcularMediaPonderada(parcelas: ParcelaAvaliacao[]): number | null {
  if (parcelas.length === 0) return null;
  let somaPesos = 0;
  let somaNormalizada = 0;
  for (const parcela of parcelas) {
    if (!numeroEntre(parcela.notaMaxima, 0.01, 1000) || !numeroEntre(parcela.peso, 0.01, 1000)) {
      throw new Error("Peso e nota máxima precisam ser positivos");
    }
    if (!numeroEntre(parcela.nota, 0, parcela.notaMaxima)) {
      throw new Error("Resultado fora do intervalo da avaliação");
    }
    somaPesos += parcela.peso;
    somaNormalizada += (parcela.nota / parcela.notaMaxima) * 10 * parcela.peso;
  }
  return Number((somaNormalizada / somaPesos).toFixed(2));
}

export function calcularNotaRecuperada(
  notaAnterior: number,
  notaRecuperacao: number,
  criterio: CriterioRecuperacao,
): number {
  if (!numeroEntre(notaAnterior, 0, 10) || !numeroEntre(notaRecuperacao, 0, 10)) {
    throw new Error("Notas de recuperação precisam estar entre 0 e 10");
  }
  if (!CRITERIOS_RECUPERACAO.includes(criterio)) throw new Error("Critério de recuperação inválido");
  if (criterio === "MAIOR_NOTA") return Math.max(notaAnterior, notaRecuperacao);
  if (criterio === "MEDIA_ARITMETICA") return Number(((notaAnterior + notaRecuperacao) / 2).toFixed(2));
  return notaRecuperacao;
}

export function validarAvaliacao(input: Record<string, unknown>) {
  const nome = typeof input.nome === "string" ? input.nome.trim() : "";
  const tipo = input.tipo;
  const peso = Number(input.peso);
  const notaMaxima = Number(input.notaMaxima);
  const dataAvaliacao = typeof input.dataAvaliacao === "string" ? input.dataAvaliacao : "";
  if (nome.length < 2 || nome.length > 120) return { ok: false as const, erro: "Nome da avaliação deve ter de 2 a 120 caracteres" };
  if (!TIPOS_AVALIACAO.includes(tipo as TipoAvaliacao)) return { ok: false as const, erro: "Tipo de avaliação inválido" };
  if (!numeroEntre(peso, 0.01, 100)) return { ok: false as const, erro: "Peso deve estar entre 0,01 e 100" };
  if (!numeroEntre(notaMaxima, 0.01, 100)) return { ok: false as const, erro: "Nota máxima deve estar entre 0,01 e 100" };
  if (dataAvaliacao && !/^\d{4}-\d{2}-\d{2}$/.test(dataAvaliacao)) return { ok: false as const, erro: "Data da avaliação inválida" };
  return { ok: true as const, avaliacao: { nome, tipo: tipo as TipoAvaliacao, peso, notaMaxima, dataAvaliacao: dataAvaliacao || null } };
}
