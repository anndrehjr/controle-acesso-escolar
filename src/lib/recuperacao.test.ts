import test from "node:test"
import assert from "node:assert/strict"
import { mediaComRecuperacao, planejarRecuperacao } from "./recuperacao"

test("recuperação substitui somente a menor nota entre B3 e B4 e nunca reduz o resultado", () => {
  assert.equal(mediaComRecuperacao(4, 4, 4, 5, 7), 5)
  assert.equal(mediaComRecuperacao(6, 6, 9, 8, 7), 7.25)
})

test("calcula a menor nota real do quarto bimestre nos cenários 7 e 8", () => {
  const p = planejarRecuperacao([4, 4, 4])
  assert.equal(p.notaMinimaB4SemRecuperacao, 8)
  assert.equal(p.cenario7?.notaMinimaB4, 5)
  assert.equal(p.cenario8?.notaMinimaB4, 0)
  assert.equal(p.cenario8?.notaMinimaB4RecuperandoB3, 4)
  assert.equal(p.cenario7?.notaMinimaB4RecuperandoB3, 5)
})

test("identifica cenário impossível mesmo com recuperação 8", () => {
  const p = planejarRecuperacao([0, 0, 0])
  assert.equal(p.cenario8?.possivel, false)
  assert.equal(p.cenario8?.notaMinimaB4, null)
})

test("não inventa zero quando falta um dos três bimestres", () => {
  const p = planejarRecuperacao([4, null, 5])
  assert.equal(p.dadosCompletos, false)
  assert.equal(p.cenario7, null)
})

test("informa quando a recuperação 7 não melhora uma nota B3 maior", () => {
  const p = planejarRecuperacao([4, 4, 8])
  assert.equal(p.cenario7?.recuperaB3, false)
  assert.equal(p.cenario7?.notaMinimaB4RecuperandoB3, null)
})
