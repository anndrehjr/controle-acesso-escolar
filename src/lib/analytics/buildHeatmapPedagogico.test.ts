import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHeatmapPedagogico } from "./buildHeatmapPedagogico";
import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "./types";

const TURMA: Turma = { id: "t1", nome: "6º Ano A", total_ativos: 1, grupo_pedagogico: "EF" };
const DISCIPLINAS: Disciplina[] = [{ id: "d1", nome: "Matemática" }, { id: "d2", nome: "Português" }];
const MATRIZ: MatrizDisciplina[] = [
  { id: "m1", escola_id: "e1", etapa: "EF", codigo: "C01", disciplina_id: "d1", ativo: true },
  { id: "m2", escola_id: "e1", etapa: "EF", codigo: "C02", disciplina_id: "d2", ativo: true },
];

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

function nota(alunoId: string, disciplinaId: string, valor: number | null): Nota {
  return {
    id: `${alunoId}-${disciplinaId}`,
    aluno_id: alunoId,
    turma_id: "t1",
    disciplina_id: disciplinaId,
    nota: valor,
    bimestre: 1,
    ano_letivo: 2026,
  };
}

test("monta uma linha por aluno com uma célula por disciplina da matriz da turma", () => {
  const alunos = [aluno("a1")];
  const notas = [nota("a1", "d1", 8), nota("a1", "d2", 4)];

  const [linha] = buildHeatmapPedagogico({ alunos, notas, turmas: [TURMA], disciplinas: DISCIPLINAS, matriz: MATRIZ });

  assert.equal(linha.alunos.length, 1);
  assert.equal(linha.alunos[0].disciplinas.length, 2);
  assert.equal(linha.alunos[0].media, 6); // (8+4)/2
});

test("disciplina sem nota lançada aparece com nota null, não quebra a média", () => {
  const alunos = [aluno("a1")];
  const notas = [nota("a1", "d1", 8)]; // d2 sem nenhuma nota

  const [linha] = buildHeatmapPedagogico({ alunos, notas, turmas: [TURMA], disciplinas: DISCIPLINAS, matriz: MATRIZ });

  const d2 = linha.alunos[0].disciplinas.find((d) => d.disciplinaId === "d2");
  assert.equal(d2?.nota, null);
  assert.equal(linha.alunos[0].media, 8); // média só considera a que tem nota
});

test("aluno TRANSFERIDO não aparece nas linhas do heatmap", () => {
  const alunos = [aluno("a1", { status: "TRANSFERIDO" })];
  const notas = [nota("a1", "d1", 8)];

  const [linha] = buildHeatmapPedagogico({ alunos, notas, turmas: [TURMA], disciplinas: DISCIPLINAS, matriz: MATRIZ });

  assert.equal(linha.alunos.length, 0);
});

test("turma com etapa que não bate com nenhuma matriz não lista nenhuma disciplina", () => {
  const outraTurma: Turma = { id: "t2", nome: "3ª Série A", total_ativos: 1, grupo_pedagogico: "EM" };
  const alunos = [aluno("a1", { turma_id: "t2" })];

  const [linha] = buildHeatmapPedagogico({ alunos, notas: [], turmas: [outraTurma], disciplinas: DISCIPLINAS, matriz: MATRIZ });

  assert.equal(linha.disciplinas.length, 0);
});
