import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRiscoAcademico } from "./buildRiscoAcademico";
import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "./types";

const TURMA: Turma = { id: "t1", nome: "6º Ano A", total_ativos: 1, grupo_pedagogico: "EF" };

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

const DISCIPLINAS: Disciplina[] = [
  { id: "d1", nome: "Matemática" },
  { id: "d2", nome: "Português" },
  { id: "d3", nome: "Ciências" },
  { id: "d4", nome: "História" },
  { id: "d5", nome: "Geografia" },
];

const MATRIZ: MatrizDisciplina[] = DISCIPLINAS.map((d, i) => ({
  id: `m${i + 1}`,
  escola_id: "e1",
  etapa: "EF",
  codigo: `C0${i + 1}`,
  disciplina_id: d.id,
  ativo: true,
}));

function nota(alunoId: string, disciplinaId: string, bimestre: number, valor: number): Nota {
  return {
    id: `${alunoId}-${disciplinaId}-${bimestre}`,
    aluno_id: alunoId,
    turma_id: "t1",
    disciplina_id: disciplinaId,
    nota: valor,
    bimestre,
    ano_letivo: 2026,
  };
}

test("aluno com 3+ disciplinas com média abaixo de 5 é classificado crítico", () => {
  const a1 = aluno("a1");
  const notas: Nota[] = [
    nota("a1", "d1", 1, 3), // Matemática: média 3 -> risco
    nota("a1", "d2", 1, 4), // Português: média 4 -> risco
    nota("a1", "d3", 1, 2), // Ciências: média 2 -> risco
    nota("a1", "d4", 1, 8), // História: ok
    nota("a1", "d5", 1, 9), // Geografia: ok
  ];

  const resultado = buildRiscoAcademico({
    alunos: [a1],
    notas,
    turmas: [TURMA],
    disciplinas: DISCIPLINAS,
    matriz: MATRIZ,
  });

  assert.equal(resultado.criticos.length, 1);
  assert.equal(resultado.atencao.length, 0);
  assert.equal(resultado.criticos[0].totalDisciplinasRisco, 3);
  assert.equal(resultado.criticos[0].status, "critico");
});

test("aluno com 1-2 disciplinas abaixo de 5 é classificado atenção, não crítico", () => {
  const a1 = aluno("a1");
  const notas: Nota[] = [
    nota("a1", "d1", 1, 3),
    nota("a1", "d2", 1, 8),
    nota("a1", "d3", 1, 9),
  ];

  const resultado = buildRiscoAcademico({
    alunos: [a1],
    notas,
    turmas: [TURMA],
    disciplinas: DISCIPLINAS,
    matriz: MATRIZ,
  });

  assert.equal(resultado.criticos.length, 0);
  assert.equal(resultado.atencao.length, 1);
  assert.equal(resultado.atencao[0].totalDisciplinasRisco, 1);
});

test("aluno sem nenhuma disciplina abaixo de 5 não aparece em nenhuma lista", () => {
  const a1 = aluno("a1");
  const notas: Nota[] = [nota("a1", "d1", 1, 8), nota("a1", "d2", 1, 9)];

  const resultado = buildRiscoAcademico({
    alunos: [a1],
    notas,
    turmas: [TURMA],
    disciplinas: DISCIPLINAS,
    matriz: MATRIZ,
  });

  assert.equal(resultado.total, 0);
});

test("aluno TRANSFERIDO ou inativo é sempre excluído, mesmo com notas baixas", () => {
  const transferido = aluno("a1", { status: "TRANSFERIDO" });
  const inativo = aluno("a2", { ativo: false });
  const notas: Nota[] = [
    nota("a1", "d1", 1, 2),
    nota("a1", "d2", 1, 2),
    nota("a1", "d3", 1, 2),
    nota("a2", "d1", 1, 2),
    nota("a2", "d2", 1, 2),
    nota("a2", "d3", 1, 2),
  ];

  const resultado = buildRiscoAcademico({
    alunos: [transferido, inativo],
    notas,
    turmas: [TURMA],
    disciplinas: DISCIPLINAS,
    matriz: MATRIZ,
  });

  assert.equal(resultado.total, 0);
});

test("disciplina com as 4 notas lançadas e soma dentro da margem vira conselho, não reprovado direto", () => {
  const a1 = aluno("a1");
  // soma = 4+4+4+5 = 17 -> falta 3 pra 20, dentro da margem de conselho (3)
  const notas: Nota[] = [
    nota("a1", "d1", 1, 4),
    nota("a1", "d1", 2, 4),
    nota("a1", "d1", 3, 4),
    nota("a1", "d1", 4, 5),
  ];

  const resultado = buildRiscoAcademico({
    alunos: [a1],
    notas,
    turmas: [TURMA],
    disciplinas: DISCIPLINAS,
    matriz: MATRIZ,
  });

  const item = [...resultado.criticos, ...resultado.atencao][0];
  assert.ok(item, "aluno deveria aparecer com a disciplina em risco");
  const disc = item.disciplinas.find((d) => d.disciplinaId === "d1");
  assert.ok(disc);
  assert.equal(disc?.emConselho, true);
});

test("disciplina com as 4 notas lançadas e soma bem abaixo da margem NÃO vira conselho", () => {
  const a1 = aluno("a1");
  // soma = 2+2+2+2 = 8 -> falta 12 pra 20, muito além da margem de conselho (3)
  const notas: Nota[] = [
    nota("a1", "d1", 1, 2),
    nota("a1", "d1", 2, 2),
    nota("a1", "d1", 3, 2),
    nota("a1", "d1", 4, 2),
  ];

  const resultado = buildRiscoAcademico({
    alunos: [a1],
    notas,
    turmas: [TURMA],
    disciplinas: DISCIPLINAS,
    matriz: MATRIZ,
  });

  const item = [...resultado.criticos, ...resultado.atencao][0];
  const disc = item?.disciplinas.find((d) => d.disciplinaId === "d1");
  assert.ok(disc);
  assert.equal(disc?.emConselho, false);
});

test("disciplina com só 2 de 4 bimestres lançados usa o ritmo (média atual), não a regra de fechamento — regressão do bug do bimestreAtual", () => {
  const a1 = aluno("a1");
  // Só bimestre 1 e 2 lançados, soma 4 (média 2) — ritmo abaixo de 5, mas NÃO é fechamento
  // (só 2 de 4 notas existem). Isso não pode disparar a regra de "soma < 20" do fechamento.
  const notas: Nota[] = [nota("a1", "d1", 1, 2), nota("a1", "d1", 2, 2)];

  const resultado = buildRiscoAcademico({
    alunos: [a1],
    notas,
    turmas: [TURMA],
    disciplinas: DISCIPLINAS,
    matriz: MATRIZ,
  });

  const item = [...resultado.criticos, ...resultado.atencao][0];
  const disc = item?.disciplinas.find((d) => d.disciplinaId === "d1");
  assert.ok(disc, "disciplina deveria estar em risco pelo ritmo (média 2 < 5)");
  assert.equal(disc?.nota, 2);
  assert.equal(disc?.emConselho, false, "conselho só existe no fechamento com as 4 notas");
});

test("abaixoBasico e total sempre são a soma de críticos + atenção", () => {
  const a1 = aluno("a1");
  const a2 = aluno("a2", { numero_chamada: 2 });
  const notas: Nota[] = [
    nota("a1", "d1", 1, 2),
    nota("a1", "d2", 1, 2),
    nota("a1", "d3", 1, 2),
    nota("a2", "d1", 1, 3),
  ];

  const resultado = buildRiscoAcademico({
    alunos: [a1, a2],
    notas,
    turmas: [TURMA],
    disciplinas: DISCIPLINAS,
    matriz: MATRIZ,
  });

  assert.equal(resultado.abaixoBasico, resultado.criticos.length + resultado.atencao.length);
  assert.equal(resultado.total, resultado.criticos.length + resultado.atencao.length);
});
