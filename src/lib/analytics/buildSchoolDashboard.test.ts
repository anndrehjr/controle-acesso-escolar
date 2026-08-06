import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSchoolDashboard } from "./buildSchoolDashboard";
import type { Aluno, Disciplina, Nota, Turma } from "./types";

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

function nota(alunoId: string, disciplinaId: string, valor: number, extra: Partial<Nota> = {}): Nota {
  return {
    id: `${alunoId}-${disciplinaId}-${extra.bimestre ?? 1}`,
    aluno_id: alunoId,
    turma_id: "t1",
    disciplina_id: disciplinaId,
    nota: valor,
    bimestre: 1,
    ano_letivo: 2026,
    ...extra,
  };
}

const TURMA: Turma = { id: "t1", nome: "6º Ano A", total_ativos: 2 };
const DISCIPLINAS: Disciplina[] = [{ id: "d1", nome: "Matemática" }];

test("média geral considera só notas válidas de alunos ativos", () => {
  const alunos = [aluno("a1"), aluno("a2", { status: "TRANSFERIDO" })];
  const notas = [nota("a1", "d1", 8), nota("a2", "d1", 2)]; // a2 é transferido, não deve contar

  const resultado = buildSchoolDashboard({ alunos, notas, turmas: [TURMA], disciplinas: DISCIPLINAS });

  assert.equal(resultado.mediaGeral, 8);
  assert.equal(resultado.notasValidas.length, 1);
});

test("filtra por bimestre e ano letivo quando informados", () => {
  const alunos = [aluno("a1")];
  const notas = [
    nota("a1", "d1", 9, { bimestre: 1, ano_letivo: 2026 }),
    nota("a1", "d1", 1, { bimestre: 2, ano_letivo: 2026 }),
  ];

  const resultado = buildSchoolDashboard({
    alunos,
    notas,
    turmas: [TURMA],
    disciplinas: DISCIPLINAS,
    bimestre: 1,
    anoLetivo: 2026,
  });

  assert.equal(resultado.notasValidas.length, 1);
  assert.equal(resultado.mediaGeral, 9);
});

test("classifica aluno por nível: crítico <5, básico 5-6.9, adequado 7-8.9, avançado 9+", () => {
  const alunos = [aluno("a1"), aluno("a2", { numero_chamada: 2 }), aluno("a3", { numero_chamada: 3 })];
  const notas = [nota("a1", "d1", 3), nota("a2", "d1", 6), nota("a3", "d1", 9.5)];

  const resultado = buildSchoolDashboard({ alunos, notas, turmas: [TURMA], disciplinas: DISCIPLINAS });

  assert.equal(resultado.alunosCriticos.length, 1);
  assert.equal(resultado.alunosAtencao, 1); // básico
  assert.equal(resultado.alunosAdequadosOuAvancados.length, 1); // avançado
});

test("aluno sem nenhuma nota não conta em alunosComNota nem quebra o cálculo", () => {
  const alunos = [aluno("a1")];
  const resultado = buildSchoolDashboard({ alunos, notas: [], turmas: [TURMA], disciplinas: DISCIPLINAS });

  assert.equal(resultado.alunosComNota.length, 0);
  assert.equal(resultado.alunosSemNota.length, 1);
  assert.equal(resultado.mediaGeral, 0);
});

test("ranking de turmas ordena da maior pra menor média", () => {
  const turmaA: Turma = { id: "ta", nome: "Turma A", total_ativos: 1 };
  const turmaB: Turma = { id: "tb", nome: "Turma B", total_ativos: 1 };
  const alunos = [aluno("a1", { turma_id: "ta" }), aluno("a2", { turma_id: "tb", numero_chamada: 2 })];
  const notas = [
    nota("a1", "d1", 5, { turma_id: "ta" }),
    nota("a2", "d1", 9, { turma_id: "tb" }),
  ];

  const resultado = buildSchoolDashboard({ alunos, notas, turmas: [turmaA, turmaB], disciplinas: DISCIPLINAS });

  assert.equal(resultado.rankingTurmas[0].turma.id, "tb");
  assert.equal(resultado.melhorTurma?.turma.id, "tb");
});
