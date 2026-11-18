import test from 'node:test'
import assert from 'node:assert/strict'
import { sessaoDoTokenEhValida } from './auth'

test('aceita token atual de usuario ativo', () => {
  assert.equal(sessaoDoTokenEhValida({ session_version: 3 }, { ativo: true, session_version: 3 }), true)
})
test('revoga todos os tokens anteriores quando a versao muda', () => {
  assert.equal(sessaoDoTokenEhValida({ session_version: 2 }, { ativo: true, session_version: 3 }), false)
})
test('rejeita qualquer token de usuario desativado', () => {
  assert.equal(sessaoDoTokenEhValida({ session_version: 3 }, { ativo: false, session_version: 3 }), false)
})
test('mantem compatibilidade com token antigo apenas na versao inicial', () => {
  assert.equal(sessaoDoTokenEhValida({}, { ativo: true, session_version: 0 }), true)
  assert.equal(sessaoDoTokenEhValida({}, { ativo: true, session_version: 1 }), false)
})
