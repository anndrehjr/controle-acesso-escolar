export type SituacaoProjecao = "GARANTIDA" | "ALCANCAVEL" | "ATENCAO" | "INALCANCAVEL" | "DADOS_INSUFICIENTES"

export type ProjecaoNotas = {
  notas: Array<number | null>; totalRegistrado: number; bimestresRegistrados: number; bimestresRestantes: number;
  pontosNecessarios: number; mediaNecessaria: number | null; notaMinimaProximo: number | null;
  mediaAtual: number | null; mediaProjetada: number | null; situacao: SituacaoProjecao; explicacao: string;
}

const decimal = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function projetarNotas(
  valores: Array<number | null | undefined>,
  meta = 5,
  opcoes: { periodos?: number; notasInteiras?: boolean } = {},
): ProjecaoNotas {
  const periodos = opcoes.periodos ?? 4
  const notasInteiras = opcoes.notasInteiras ?? true
  const notas = Array.from({ length: periodos }, (_, i) => {
    const valor = valores[i]
    return typeof valor === "number" && Number.isFinite(valor) && valor >= 0 && valor <= 10 ? valor : null
  })
  const registradas = notas.filter((n): n is number => n !== null)
  const bimestresRegistrados = registradas.length
  const bimestresRestantes = periodos - bimestresRegistrados
  const totalRegistrado = decimal(registradas.reduce((soma, nota) => soma + nota, 0))
  const pontosNecessarios = decimal(Math.max(0, meta * periodos - totalRegistrado))
  const mediaAtual = bimestresRegistrados ? decimal(totalRegistrado / bimestresRegistrados) : null
  const mediaProjetada = mediaAtual

  if (!bimestresRegistrados) {
    return { notas, totalRegistrado, bimestresRegistrados, bimestresRestantes, pontosNecessarios,
      mediaNecessaria: null, notaMinimaProximo: null, mediaAtual, mediaProjetada,
      situacao: "DADOS_INSUFICIENTES", explicacao: "Nenhuma nota numérica registrada para uma projeção confiável." }
  }

  if (!bimestresRestantes) {
    const mediaFinal = decimal(totalRegistrado / periodos)
    const atingiu = mediaFinal >= meta
    return { notas, totalRegistrado, bimestresRegistrados, bimestresRestantes, pontosNecessarios,
      mediaNecessaria: null, notaMinimaProximo: null, mediaAtual: mediaFinal, mediaProjetada: mediaFinal,
      situacao: atingiu ? "GARANTIDA" : "INALCANCAVEL",
      explicacao: atingiu ? `Média final aritmética ${mediaFinal.toLocaleString("pt-BR")}.` : `Os quatro bimestres estão preenchidos e a média aritmética é ${mediaFinal.toLocaleString("pt-BR")}.` }
  }

  const mediaNecessariaExata = decimal(pontosNecessarios / bimestresRestantes)
  const notaMinimaProximo = bimestresRestantes === 1
    ? (notasInteiras ? Math.ceil(pontosNecessarios) : pontosNecessarios)
    : null
  let situacao: SituacaoProjecao
  if (pontosNecessarios <= 0) situacao = "GARANTIDA"
  else if (mediaNecessariaExata > 10) situacao = "INALCANCAVEL"
  else if (mediaNecessariaExata > 7) situacao = "ATENCAO"
  else situacao = "ALCANCAVEL"

  const explicacao = pontosNecessarios <= 0
    ? "A pontuação mínima anual já foi acumulada; a projeção matemática está garantida."
    : bimestresRestantes === 1
      ? notaMinimaProximo! > 10
        ? `Precisaria de ${notaMinimaProximo!.toLocaleString("pt-BR")}; não é possível alcançar a meta apenas com o período regular restante.`
        : `Menor nota válida no período restante: ${notaMinimaProximo!.toLocaleString("pt-BR")}.`
      : `Faltam ${pontosNecessarios.toLocaleString("pt-BR")} pontos em ${bimestresRestantes} bimestres (média mínima ${mediaNecessariaExata.toLocaleString("pt-BR")}).`

  return { notas, totalRegistrado, bimestresRegistrados, bimestresRestantes, pontosNecessarios,
    mediaNecessaria: mediaNecessariaExata, notaMinimaProximo, mediaAtual, mediaProjetada,
    situacao, explicacao }
}

export function simularMediaFinal(projecao: Pick<ProjecaoNotas, "totalRegistrado" | "bimestresRestantes">, nota: number, periodos = 4) {
  if (!Number.isFinite(nota) || nota < 0 || nota > 10) return null
  return decimal((projecao.totalRegistrado + nota * projecao.bimestresRestantes) / periodos)
}
