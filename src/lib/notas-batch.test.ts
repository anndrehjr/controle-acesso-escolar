import assert from "node:assert/strict";
import test from "node:test";
import { validarLoteNotas } from "./notas-batch";

const alunoId = "11111111-1111-4111-8111-111111111111";
const disciplinaId = "22222222-2222-4222-8222-222222222222";
const turmaId = "33333333-3333-4333-8333-333333333333";
const nota = { alunoId, disciplinaId, turmaId, bimestre: 1, anoLetivo: 2026, nota: 7.5 };

test("aceita lote válido e preserva nota zero", () => {
  const resultado = validarLoteNotas([{ ...nota, nota: 0 }]);
  assert.equal(resultado.ok, true);
  if (resultado.ok) assert.equal(resultado.itens[0].nota, 0);
});

test("rejeita o lote inteiro quando uma nota é inválida", () => {
  const resultado = validarLoteNotas([nota, { ...nota, alunoId: "44444444-4444-4444-8444-444444444444", nota: 11 }]);
  assert.deepEqual(resultado, { ok: false, erro: "Nota 2: valor precisa estar entre 0 e 10" });
});

test("rejeita célula duplicada no mesmo lote", () => {
  const resultado = validarLoteNotas([nota, nota]);
  assert.equal(resultado.ok, false);
  if (!resultado.ok) assert.match(resultado.erro, /mesma nota/);
});

test("rejeita identificadores e períodos inválidos", () => {
  assert.equal(validarLoteNotas([{ ...nota, turmaId: "x" }]).ok, false);
  assert.equal(validarLoteNotas([{ ...nota, bimestre: 5 }]).ok, false);
  assert.equal(validarLoteNotas([{ ...nota, anoLetivo: 1999 }]).ok, false);
});

test("respeita o limite do lote", () => {
  const resultado = validarLoteNotas([nota, { ...nota, alunoId: "44444444-4444-4444-8444-444444444444" }], 1);
  assert.deepEqual(resultado, { ok: false, erro: "Máximo de 1 notas por requisição" });
});
