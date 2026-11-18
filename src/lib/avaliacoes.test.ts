import assert from "node:assert/strict";
import test from "node:test";
import { calcularMediaPonderada, calcularNotaRecuperada, validarAvaliacao } from "./avaliacoes";

test("calcula média ponderada normalizando notas máximas diferentes", () => {
  assert.equal(calcularMediaPonderada([
    { nota: 8, notaMaxima: 10, peso: 2 },
    { nota: 15, notaMaxima: 20, peso: 1 },
  ]), 7.83);
});

test("ignora ausência de parcelas e recusa resultado fora da escala", () => {
  assert.equal(calcularMediaPonderada([]), null);
  assert.throws(() => calcularMediaPonderada([{ nota: 11, notaMaxima: 10, peso: 1 }]), /intervalo/);
});

test("aplica os três critérios de recuperação", () => {
  assert.equal(calcularNotaRecuperada(4, 7, "MAIOR_NOTA"), 7);
  assert.equal(calcularNotaRecuperada(4, 7, "MEDIA_ARITMETICA"), 5.5);
  assert.equal(calcularNotaRecuperada(4, 7, "SUBSTITUICAO"), 7);
});

test("valida os campos de uma avaliação", () => {
  assert.equal(validarAvaliacao({ nome: "Prova 1", tipo: "PROVA", peso: 2, notaMaxima: 10 }).ok, true);
  assert.equal(validarAvaliacao({ nome: "P", tipo: "PROVA", peso: 2, notaMaxima: 10 }).ok, false);
  assert.equal(validarAvaliacao({ nome: "Prova", tipo: "INVALIDO", peso: 2, notaMaxima: 10 }).ok, false);
  assert.equal(validarAvaliacao({ nome: "Prova", tipo: "PROVA", peso: 0, notaMaxima: 10 }).ok, false);
});
