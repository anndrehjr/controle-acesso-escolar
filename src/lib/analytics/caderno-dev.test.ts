import assert from "node:assert/strict";
import test from "node:test";
import { calcularNotaCaderno, componentesPadrao } from "../caderno-dev";

test("caderno sem pesos usa a média simples somente das células preenchidas", () => {
  const componentes = componentesPadrao("Matemática").slice(0, 3);
  assert.deepEqual(calcularNotaCaderno(componentes, [8, 6, null]), { nota: 7, ponderada: false });
});

test("caderno com todos os pesos usa média ponderada normalizada", () => {
  const componentes = [
    { nome: "Prova", peso: 2, notaMaxima: 10 },
    { nome: "Tarefa", peso: 1, notaMaxima: 10 },
  ];
  assert.deepEqual(calcularNotaCaderno(componentes, [9, 6]), { nota: 8, ponderada: true });
});

test("modelo de inglês preserva Speak e Prova Paulista", () => {
  assert.deepEqual(componentesPadrao("Língua Inglesa").map((item) => item.nome),
    ["Avaliação 1", "Avaliação 2", "Tarefa", "Speak", "Prova Paulista", "Engajamento"]);
});
