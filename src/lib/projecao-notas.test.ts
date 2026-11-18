import test from "node:test"
import assert from "node:assert/strict"
import { projetarNotas, simularMediaFinal } from "./projecao-notas"

test("calcula os exemplos de nota necessária no quarto bimestre", () => {
  assert.equal(projetarNotas([4, 6, 4]).notaMinimaProximo, 6)
  assert.equal(projetarNotas([4, 5, 4]).notaMinimaProximo, 7)
  assert.equal(projetarNotas([3, 3, 4]).notaMinimaProximo, 10)
  assert.equal(projetarNotas([2, 3, 4]).notaMinimaProximo, 11)
  assert.equal(projetarNotas([2, 3, 4]).situacao, "INALCANCAVEL")
  assert.equal(projetarNotas([8, 7, 6]).notaMinimaProximo, 0)
  assert.equal(projetarNotas([8, 7, 6]).situacao, "GARANTIDA")
})

test("dois períodos pendentes informam pontos e média, sem inventar nota única", () => {
  const p = projetarNotas([4, 6])
  assert.equal(p.bimestresRestantes, 2)
  assert.equal(p.pontosNecessarios, 10)
  assert.equal(p.mediaNecessaria, 5)
  assert.equal(p.notaMinimaProximo, null)
})

test("zero é nota válida; ausência e fechamento são tratados separadamente", () => {
  assert.equal(projetarNotas([0, 5, 5]).bimestresRegistrados, 3)
  assert.equal(projetarNotas([null, null, null, null]).situacao, "DADOS_INSUFICIENTES")
  assert.equal(projetarNotas([5, 5, 5, 5]).situacao, "GARANTIDA")
  assert.equal(projetarNotas([4, 4, 4, 4]).situacao, "INALCANCAVEL")
})

test("simulador não altera notas e reproduz o exemplo 4, 6, 4", () => {
  const p = projetarNotas([4, 6, 4])
  assert.equal(simularMediaFinal(p, 4), 4.5)
  assert.equal(simularMediaFinal(p, 5), 4.75)
  assert.equal(simularMediaFinal(p, 6), 5)
  assert.equal(simularMediaFinal(p, 7), 5.25)
})
