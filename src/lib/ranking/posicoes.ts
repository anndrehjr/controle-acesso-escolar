export type ItemMedia = { media: number };

export function atribuirPosicoes<T extends ItemMedia>(itens: T[]): Array<T & { posicao: number }> {
  const ordenados = [...itens].sort((a, b) => b.media - a.media);
  let posicao = 0;
  let mediaAnterior: number | null = null;
  return ordenados.map((item, indice) => {
    if (mediaAnterior === null || Math.abs(item.media - mediaAnterior) >= 0.005) posicao = indice + 1;
    mediaAnterior = item.media;
    return { ...item, posicao };
  });
}
