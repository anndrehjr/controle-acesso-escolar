import test from 'node:test'
import assert from 'node:assert/strict'
import { gerarCsv, montarRelatorio, montarRelatorioIntervencao, type RegistroRelatorio } from './relatorios'

const base: RegistroRelatorio[] = [
  { alunoId: 'a', aluno: 'Ana', numeroChamada: 1, matriculaStatus: 'ATIVA', turmaId: 't', turma: '1A', disciplinaId: 'm', disciplina: 'Matemática', bimestre: 1, nota: 4, notaStatus: 'NORMAL', origemCalculo: 'MANUAL', notaAnterior: null, notaRecuperacao: null, notaFinal: null },
  { alunoId: 'a', aluno: 'Ana', numeroChamada: 1, matriculaStatus: 'ATIVA', turmaId: 't', turma: '1A', disciplinaId: 'm', disciplina: 'Matemática', bimestre: 2, nota: 7, notaStatus: 'RECUPERACAO', origemCalculo: 'RECUPERACAO', notaAnterior: 4, notaRecuperacao: 8, notaFinal: 7 },
  { alunoId: 'b', aluno: 'Bia', numeroChamada: 2, matriculaStatus: 'ATIVA', turmaId: 't', turma: '1A', disciplinaId: 'm', disciplina: 'Matemática', bimestre: 1, nota: 6, notaStatus: 'NORMAL', origemCalculo: 'MANUAL', notaAnterior: null, notaRecuperacao: null, notaFinal: null },
]

test('relatorio por turma agrega sem perder o estado da matricula', () => {
  const resultado = montarRelatorio('turma', base)
  assert.equal(resultado.linhas.length, 2)
  assert.equal(resultado.linhas[0]['Média'], 5.5)
  assert.equal(resultado.resumo.registros, 3)
})
test('relatorio de recuperacao mostra antes, depois e diferenca', () => {
  const resultado = montarRelatorio('recuperacao', base)
  assert.equal(resultado.linhas.length, 1)
  assert.equal(resultado.linhas[0]['Diferença'], 3)
})
test('relatorio de evolucao compara primeiro e ultimo bimestre', () => {
  const resultado = montarRelatorio('evolucao', base)
  assert.equal(resultado.linhas[0]['Variação'], 3)
})
test('relatorio de risco usa apenas indicadores objetivos', () => {
  const resultado = montarRelatorio('risco', base)
  assert.equal(resultado.linhas.length, 0)
})
test('csv neutraliza formulas e inclui metadados e filtros', () => {
  const csv = gerarCsv([{ Aluno: '=CMD()', Nota: 5 }], { Escola: 'Teste', Bimestre: 2 })
  assert.match(csv, /'=CMD\(\)/)
  assert.match(csv, /"Bimestre";"2"/)
})

test('intervencao por matéria aceita um único componente abaixo de 4,5', () => {
  const resultado = montarRelatorioIntervencao([base[0]], 4.5, 1)
  assert.equal(resultado.alunos.length, 1)
  assert.equal(resultado.alunos[0].disciplinas[0].disciplina, 'Matemática')
})
