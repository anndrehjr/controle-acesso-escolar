import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDistribuicaoPedagogica } from "./buildDistribuicaoPedagogica";
import type { Aluno, Nota, Turma } from "./types";

function aluno(id: string, overrides: Partial<Aluno> = {}): Aluno {
  return {
    id,
    escola_id: "e1",
    turma_id: "t1",
    nome: `Aluno ${id}`,
    numero_chamada: 1,
    status: "ATIVO",
    em_atencao: false,
    ativo: true,
    ...overrides,
  };
}

function nota(alunoId: string, valor: number): Nota {
  return {
    id: `${alunoId}-n`,
    aluno_id: alunoId,
    turma_id: "t1",
    disciplina_id: "d1",
    nota: valor,
    bimestre: 1,
    ano_letivo: 2026,
  };
}

const TURMA: Turma = { id: "t1", nome: "6º Ano A", total_ativos: 4 };

test("classifica cada aluno numa única faixa (crítico/básico/adequado/avançado) pela média dele", () => {
  const alunos = [
    aluno("a1", { numero_chamada: 1 }),
    aluno("a2", { numero_chamada: 2 }),
    aluno("a3", { numero_chamada: 3 }),
    aluno("a4", { numero_chamada: 4 }),
    aluno("a5", { numero_chamada: 5 }),
    aluno("a6", { numero_chamada: 6 }),
  ];
  const notas = [nota("a1", 3), nota("a2", 5.5), nota("a3", 7.5), nota("a4", 9.5), nota("a5", 8), nota("a6", 8.1)];

  const resultado = buildDistribuicaoPedagogica({ alunos, notas, turmas: [TURMA] });

  assert.deepEqual(resultado.distribuicaoPorTurma[0], {
    turma: "6º Ano A",
    critico: 1,
    basico: 1,
    adequado: 1,
    avancado: 3,
  });
});

test("aluno TRANSFERIDO não entra na distribuição da turma", () => {
  const alunos = [aluno("a1", { status: "TRANSFERIDO" })];
  const notas = [nota("a1", 2)];

  const resultado = buildDistribuicaoPedagogica({ alunos, notas, turmas: [TURMA] });

  const total =
    resultado.distribuicaoPorTurma[0].critico +
    resultado.distribuicaoPorTurma[0].basico +
    resultado.distribuicaoPorTurma[0].adequado +
    resultado.distribuicaoPorTurma[0].avancado;
  assert.equal(total, 0);
});

test("distribuicaoGeral soma todas as turmas corretamente", () => {
  const turmaB: Turma = { id: "t2", nome: "7º Ano A", total_ativos: 1 };
  const alunos = [aluno("a1", { turma_id: "t1" }), aluno("a2", { turma_id: "t2", numero_chamada: 2 })];
  const notas = [{ ...nota("a1", 3) }, { ...nota("a2", 3), turma_id: "t2" }];

  const resultado = buildDistribuicaoPedagogica({ alunos, notas, turmas: [TURMA, turmaB] });

  assert.equal(resultado.distribuicaoGeral.critico, 2);
});
