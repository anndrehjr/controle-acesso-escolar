import assert from "node:assert/strict";
import test from "node:test";
import { atribuirPosicoes } from "./posicoes";

test("ordena médias e preserva empate na mesma posição", () => {
  const resultado = atribuirPosicoes([{ nome: "B", media: 8.5 }, { nome: "A", media: 9 }, { nome: "C", media: 8.5 }]);
  assert.deepEqual(resultado.map(({ nome, posicao }) => [nome, posicao]), [["A", 1], ["B", 2], ["C", 2]]);
});
