export const TIPOS_RELATORIO = ["turma", "disciplina", "aluno", "recuperacao", "evolucao", "risco", "intervencao"] as const
export type TipoRelatorio = (typeof TIPOS_RELATORIO)[number]
export type ValorRelatorio = string | number | null

export type RegistroRelatorio = {
  alunoId: string
  aluno: string
  numeroChamada: number
  matriculaStatus: string
  turmaId: string
  turma: string
  disciplinaId: string
  disciplina: string
  bimestre: number
  nota: number
  notaStatus: string
  origemCalculo: string
  notaAnterior: number | null
  notaRecuperacao: number | null
  notaFinal: number | null
}

export type ResultadoRelatorio = {
  linhas: Array<Record<string, ValorRelatorio>>
  resumo: {
    registros: number
    mediaGeral: number | null
    abaixoMedia: number
    recuperacoes: number
  }
}

export type AlunoIntervencao = {
  alunoId: string
  aluno: string
  turma: string
  numeroChamada: number
  mediaGeral: number
  disciplinas: Array<{
    disciplina: string
    b1: number | null
    b2: number | null
    b3: number | null
    b4: number | null
    media: number
  }>
}

const arredondar = (valor: number) => Number(valor.toFixed(2))
const media = (valores: number[]) =>
  valores.length ? arredondar(valores.reduce((soma, valor) => soma + valor, 0) / valores.length) : null

function agrupar<T>(itens: T[], chave: (item: T) => string): Map<string, T[]> {
  const grupos = new Map<string, T[]>()
  for (const item of itens) {
    const id = chave(item)
    grupos.set(id, [...(grupos.get(id) ?? []), item])
  }
  return grupos
}

function resumo(registros: RegistroRelatorio[]): ResultadoRelatorio["resumo"] {
  return {
    registros: registros.length,
    mediaGeral: media(registros.map((item) => item.nota)),
    abaixoMedia: registros.filter((item) => item.nota < 5).length,
    recuperacoes: registros.filter((item) => item.notaRecuperacao !== null).length,
  }
}

export function montarRelatorio(tipo: TipoRelatorio, registros: RegistroRelatorio[]): ResultadoRelatorio {
  let linhas: Array<Record<string, ValorRelatorio>> = []

  if (tipo === "turma") {
    linhas = [...agrupar(registros, (item) => item.alunoId).values()].map((grupo) => {
      const primeiro = grupo[0]
      const notas = grupo.map((item) => item.nota)
      return {
        "Nº": primeiro.numeroChamada,
        Aluno: primeiro.aluno,
        Turma: primeiro.turma,
        "Situação": primeiro.matriculaStatus,
        Média: media(notas),
        Menor: Math.min(...notas),
        Maior: Math.max(...notas),
        "Notas abaixo de 5": notas.filter((nota) => nota < 5).length,
        Recuperações: grupo.filter((item) => item.notaRecuperacao !== null).length,
      }
    })
  } else if (tipo === "disciplina") {
    linhas = [...agrupar(registros, (item) => item.disciplinaId).values()].map((grupo) => {
      const primeiro = grupo[0]
      const notas = grupo.map((item) => item.nota)
      return {
        Disciplina: primeiro.disciplina,
        Média: media(notas),
        Menor: Math.min(...notas),
        Maior: Math.max(...notas),
        Lançamentos: notas.length,
        "Abaixo de 5": notas.filter((nota) => nota < 5).length,
        "Percentual com nota ≥ 5": arredondar(notas.filter((nota) => nota >= 5).length / notas.length * 100),
      }
    })
  } else if (tipo === "aluno") {
    linhas = registros.map((item) => ({
      Aluno: item.aluno,
      Turma: item.turma,
      Disciplina: item.disciplina,
      Bimestre: item.bimestre,
      Nota: item.nota,
      Origem: item.origemCalculo,
      "Antes da recuperação": item.notaAnterior,
      Recuperação: item.notaRecuperacao,
      "Nota final": item.notaFinal,
      "Situação da matrícula": item.matriculaStatus,
    }))
  } else if (tipo === "recuperacao") {
    linhas = registros.filter((item) => item.notaRecuperacao !== null).map((item) => ({
      Aluno: item.aluno,
      Turma: item.turma,
      Disciplina: item.disciplina,
      Bimestre: item.bimestre,
      "Nota anterior": item.notaAnterior,
      Recuperação: item.notaRecuperacao,
      "Nota final": item.notaFinal,
      Diferença: item.notaAnterior === null || item.notaFinal === null
        ? null : arredondar(item.notaFinal - item.notaAnterior),
      Melhorou: item.notaAnterior !== null && item.notaFinal !== null && item.notaFinal > item.notaAnterior ? "Sim" : "Não",
    }))
  } else if (tipo === "evolucao") {
    linhas = [...agrupar(registros, (item) => item.alunoId + ":" + item.disciplinaId).values()].map((grupo) => {
      const ordenado = [...grupo].sort((a, b) => a.bimestre - b.bimestre)
      const porBimestre = new Map(ordenado.map((item) => [item.bimestre, item.nota]))
      const primeiro = ordenado[0]
      const ultimo = ordenado[ordenado.length - 1]
      return {
        Aluno: primeiro.aluno,
        Turma: primeiro.turma,
        Disciplina: primeiro.disciplina,
        "1º bimestre": porBimestre.get(1) ?? null,
        "2º bimestre": porBimestre.get(2) ?? null,
        "3º bimestre": porBimestre.get(3) ?? null,
        "4º bimestre": porBimestre.get(4) ?? null,
        Variação: primeiro.bimestre === ultimo.bimestre ? null : arredondar(ultimo.nota - primeiro.nota),
      }
    })
  } else {
    linhas = [...agrupar(registros, (item) => item.alunoId).values()].map((grupo) => {
      const primeiro = grupo[0]
      const mediasDisciplina = [...agrupar(grupo, (item) => item.disciplinaId).values()]
        .map((itens) => media(itens.map((item) => item.nota)) ?? 0)
      const abaixo = mediasDisciplina.filter((valor) => valor < 5).length
      const baixas = grupo.filter((item) => item.nota < 5).length
      const quedas = [...agrupar(grupo, (item) => item.disciplinaId).values()].filter((itens) => {
        const ordenado = [...itens].sort((a, b) => a.bimestre - b.bimestre)
        return ordenado.length > 1 && ordenado[ordenado.length - 1].nota < ordenado[0].nota
      }).length
      return {
        Aluno: primeiro.aluno,
        Turma: primeiro.turma,
        Média: media(grupo.map((item) => item.nota)),
        "Disciplinas abaixo de 5": abaixo,
        "Notas baixas": baixas,
        "Disciplinas em queda": quedas,
        Indicadores: String(abaixo) + " disciplina(s) abaixo de 5; " +
          String(baixas) + " nota(s) baixa(s); " + String(quedas) + " disciplina(s) em queda",
      }
    }).filter((linha) =>
      Number(linha["Disciplinas abaixo de 5"]) > 0 ||
      Number(linha["Notas baixas"]) > 1 ||
      Number(linha["Disciplinas em queda"]) > 1
    )
  }

  return { linhas, resumo: resumo(registros) }
}

export function montarRelatorioIntervencao(
  registros: RegistroRelatorio[],
  mediaLimite = 4.5,
  minimoDisciplinas = 3,
): { alunos: AlunoIntervencao[]; linhas: Array<Record<string, ValorRelatorio>> } {
  const alunos = [...agrupar(
    registros.filter((item) => item.matriculaStatus === "ATIVA"),
    (item) => item.alunoId,
  ).values()].map((grupo) => {
    const primeiro = grupo[0]
    const disciplinas = [...agrupar(grupo, (item) => item.disciplinaId).values()]
      .map((notasDisciplina) => {
        const porBimestre = new Map(notasDisciplina.map((item) => [item.bimestre, item.nota]))
        return {
          disciplina: notasDisciplina[0].disciplina,
          b1: porBimestre.get(1) ?? null,
          b2: porBimestre.get(2) ?? null,
          b3: porBimestre.get(3) ?? null,
          b4: porBimestre.get(4) ?? null,
          media: media(notasDisciplina.map((item) => item.nota)) ?? 0,
        }
      })
      .filter((item) => item.media < mediaLimite)
      .sort((a, b) => a.media - b.media || a.disciplina.localeCompare(b.disciplina, "pt-BR"))

    return {
      alunoId: primeiro.alunoId,
      aluno: primeiro.aluno,
      turma: primeiro.turma,
      numeroChamada: primeiro.numeroChamada,
      mediaGeral: media(grupo.map((item) => item.nota)) ?? 0,
      disciplinas,
    }
  }).filter((aluno) => aluno.disciplinas.length >= minimoDisciplinas)
    .sort((a, b) => b.disciplinas.length - a.disciplinas.length || a.mediaGeral - b.mediaGeral || a.numeroChamada - b.numeroChamada)

  const linhas = alunos.flatMap((aluno) => aluno.disciplinas.map((disciplina) => ({
    "Nº": aluno.numeroChamada,
    Aluno: aluno.aluno,
    Turma: aluno.turma,
    "Média geral": aluno.mediaGeral,
    Disciplina: disciplina.disciplina,
    "1º bimestre": disciplina.b1,
    "2º bimestre": disciplina.b2,
    "3º bimestre": disciplina.b3,
    "4º bimestre": disciplina.b4,
    "Média da disciplina": disciplina.media,
  })))

  return { alunos, linhas }
}

function protegerCelula(valor: ValorRelatorio): string {
  let texto = valor === null ? "" : String(valor)
  if (/^[=+@-]/.test(texto)) texto = "'" + texto
  return '"' + texto.replaceAll('"', '""') + '"'
}

export function gerarCsv(
  linhas: Array<Record<string, ValorRelatorio>>,
  metadados: Record<string, ValorRelatorio>,
): string {
  const cabecalhos = linhas.length ? Object.keys(linhas[0]) : ["Resultado"]
  const saida = Object.entries(metadados).map(([chave, valor]) =>
    protegerCelula(chave) + ";" + protegerCelula(valor)
  )
  saida.push("")
  saida.push(cabecalhos.map((item) => protegerCelula(item)).join(";"))
  for (const linha of linhas) {
    saida.push(cabecalhos.map((item) => protegerCelula(linha[item] ?? null)).join(";"))
  }
  return "\ufeff" + saida.join("\r\n")
}
