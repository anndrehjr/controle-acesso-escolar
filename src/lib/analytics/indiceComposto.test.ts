import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularIndiceComposto } from './indiceComposto'

test('retorna nulo sem notas validas', () => {
  assert.equal(calcularIndiceComposto([]), null)
})
test('combina media, percentual e evolucao com pesos documentados', () => {
  const resultado = calcularIndiceComposto([
    { alunoId: 'a', disciplinaId: 'd', bimestre: 1, nota: 4 },
    { alunoId: 'a', disciplinaId: 'd', bimestre: 2, nota: 6 },
  ])
  assert.deepEqual(resultado, {
    indice: 54, mediaNormalizada: 50, percentualAcimaMedia: 50,
    evolucaoNormalizada: 70, variacaoMedia: 2, totalNotas: 2,
    paresComparaveis: 1, experimental: true,
  })
})
test('usa base neutra de evolucao quando nao ha pares comparaveis', () => {
  const resultado = calcularIndiceComposto([
    { alunoId: 'a', disciplinaId: 'd', bimestre: 1, nota: 8 },
  ])
  assert.equal(resultado?.indice, 80)
  assert.equal(resultado?.paresComparaveis, 0)
})
test('ignora valores fora da escala oficial', () => {
  const resultado = calcularIndiceComposto([
    { alunoId: 'a', disciplinaId: 'd', bimestre: 1, nota: 7 },
    { alunoId: 'a', disciplinaId: 'd', bimestre: 2, nota: 12 },
  ])
  assert.equal(resultado?.totalNotas, 1)
})
