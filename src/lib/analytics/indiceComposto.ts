export type RegistroIndice = {
  alunoId: string
  disciplinaId: string
  bimestre: number
  nota: number
}

export type IndiceComposto = {
  indice: number
  mediaNormalizada: number
  percentualAcimaMedia: number
  evolucaoNormalizada: number
  variacaoMedia: number | null
  totalNotas: number
  paresComparaveis: number
  experimental: true
}

const limitar = (valor: number, minimo: number, maximo: number) =>
  Math.min(maximo, Math.max(minimo, valor))

export function calcularIndiceComposto(registros: RegistroIndice[]): IndiceComposto | null {
  const validos = registros.filter((item) =>
    Number.isFinite(item.nota) && item.nota >= 0 && item.nota <= 10 &&
    Number.isInteger(item.bimestre) && item.bimestre >= 1 && item.bimestre <= 4
  )
  if (validos.length === 0) return null

  const media = validos.reduce((soma, item) => soma + item.nota, 0) / validos.length
  const percentualAcimaMedia = validos.filter((item) => item.nota >= 5).length / validos.length * 100
  const grupos = new Map<string, RegistroIndice[]>()
  for (const item of validos) {
    const chave = item.alunoId + ":" + item.disciplinaId
    const grupo = grupos.get(chave) ?? []
    grupo.push(item)
    grupos.set(chave, grupo)
  }

  const variacoes: number[] = []
  for (const grupo of grupos.values()) {
    const ordenado = [...grupo].sort((a, b) => a.bimestre - b.bimestre)
    const primeiro = ordenado[0]
    const ultimo = ordenado[ordenado.length - 1]
    if (primeiro.bimestre !== ultimo.bimestre) variacoes.push(ultimo.nota - primeiro.nota)
  }
  const variacaoMedia = variacoes.length
    ? variacoes.reduce((soma, valor) => soma + valor, 0) / variacoes.length
    : null
  const evolucaoNormalizada = variacaoMedia === null ? 50 : limitar(50 + variacaoMedia * 10, 0, 100)
  const mediaNormalizada = limitar(media * 10, 0, 100)
  const indiceCalculado = mediaNormalizada * 0.5 + percentualAcimaMedia * 0.3 + evolucaoNormalizada * 0.2

  return {
    indice: Number(indiceCalculado.toFixed(1)),
    mediaNormalizada: Number(mediaNormalizada.toFixed(1)),
    percentualAcimaMedia: Number(percentualAcimaMedia.toFixed(1)),
    evolucaoNormalizada: Number(evolucaoNormalizada.toFixed(1)),
    variacaoMedia: variacaoMedia === null ? null : Number(variacaoMedia.toFixed(2)),
    totalNotas: validos.length,
    paresComparaveis: variacoes.length,
    experimental: true,
  }
}
