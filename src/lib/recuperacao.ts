export type CenarioRecuperacao = {
  notaRecuperacao: number
  notaMinimaB4: number | null
  notaMinimaB4RecuperandoB3: number | null
  recuperaB3: boolean
  mediaFinalProjetada: number | null
  possivel: boolean
}

export type PlanejamentoRecuperacao = {
  dadosCompletos: boolean
  notaMinimaB4SemRecuperacao: number | null
  cenario7: CenarioRecuperacao | null
  cenario8: CenarioRecuperacao | null
}

const validaNota = (valor: number | null | undefined): valor is number =>
  typeof valor === "number" && Number.isFinite(valor) && valor >= 0 && valor <= 10

export function mediaComRecuperacao(
  b1: number,
  b2: number,
  b3: number,
  b4: number,
  recuperacao: number,
) {
  const menor = Math.min(b3, b4)
  const substituta = Math.max(menor, recuperacao)
  return (b1 + b2 + b3 + b4 - menor + substituta) / 4
}

function menorInteira(aceita: (nota: number) => boolean, inicio = 0) {
  for (let nota = Math.max(0, Math.ceil(inicio)); nota <= 10; nota += 1) {
    if (aceita(nota)) return nota
  }
  return null
}

function montarCenario(b1: number, b2: number, b3: number, recuperacao: number, meta: number): CenarioRecuperacao {
  const notaMinimaB4 = menorInteira((b4) => mediaComRecuperacao(b1, b2, b3, b4, recuperacao) >= meta)
  const recuperaB3 = recuperacao > b3
  const notaMinimaB4RecuperandoB3 = recuperaB3
    ? menorInteira(
        (b4) => b4 >= b3 && (b1 + b2 + recuperacao + b4) / 4 >= meta,
        b3,
      )
    : null
  return {
    notaRecuperacao: recuperacao,
    notaMinimaB4,
    notaMinimaB4RecuperandoB3,
    recuperaB3,
    mediaFinalProjetada: notaMinimaB4 == null ? null : mediaComRecuperacao(b1, b2, b3, notaMinimaB4, recuperacao),
    possivel: notaMinimaB4 != null,
  }
}

export function planejarRecuperacao(
  valores: Array<number | null | undefined>,
  meta = 5,
): PlanejamentoRecuperacao {
  const [b1, b2, b3] = valores
  if (!validaNota(b1) || !validaNota(b2) || !validaNota(b3)) {
    return { dadosCompletos: false, notaMinimaB4SemRecuperacao: null, cenario7: null, cenario8: null }
  }
  const notaMinimaB4SemRecuperacao = menorInteira((b4) => (b1 + b2 + b3 + b4) / 4 >= meta)
  return {
    dadosCompletos: true,
    notaMinimaB4SemRecuperacao,
    cenario7: montarCenario(b1, b2, b3, 7, meta),
    cenario8: montarCenario(b1, b2, b3, 8, meta),
  }
}
