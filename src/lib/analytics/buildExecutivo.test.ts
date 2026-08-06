import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExecutivo, gerarObservacoes } from "./buildExecutivo";
import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "./types";

function aluno(id: string, turmaId: string, overrides: Partial<Aluno> = {}): Aluno {
  return {
    id,
    escola_id: "e1",
    turma_id: turmaId,
    nome: `Aluno ${id}`,
    numero_chamada: 1,
    status: "ATIVO",
    em_atencao: false,
    ativo: true,
    ...overrides,
  };
}

function nota(alunoId: string, disciplinaId: string, turmaId: string, bimestre: number, valor: number): Nota {
  return {
    id: `${alunoId}-${disciplinaId}-${bimestre}`,
    aluno_id: alunoId,
    turma_id: turmaId,
    disciplina_id: disciplinaId,
    nota: valor,
    bimestre,
    ano_letivo: 2026,
  };
}

const turmaFund: Turma = { id: "t-ef", nome: "6º Ano A", total_ativos: 1, grupo_pedagogico: "EF" };
const turmaMedio: Turma = { id: "t-em", nome: "1ª Série A", total_ativos: 1, grupo_pedagogico: "EM" };
// Mesma disciplina (mesmo id) usada nas duas turmas — como acontece de verdade no banco.
const MATEMATICA: Disciplina = { id: "mat", nome: "Matemática" };
const MATRIZ: MatrizDisciplina[] = [
  { id: "m1", escola_id: "e1", etapa: "EF", codigo: "C01", disciplina_id: "mat", ativo: true },
  { id: "m2", escola_id: "e1", etapa: "EM", codigo: "C01", disciplina_id: "mat", ativo: true },
];

test("detecta o último bimestre com dados reais, não trava no bimestre_atual administrativo", () => {
  const alunos = [aluno("a1", "t-ef")];
  const notas = [nota("a1", "mat", "t-ef", 1, 8), nota("a1", "mat", "t-ef", 2, 9)];

  const resultado = buildExecutivo({
    alunos,
    turmas: [turmaFund],
    disciplinas: [MATEMATICA],
    matriz: MATRIZ,
    todasNotas: notas,
    anoLetivo: 2026,
  });

  assert.equal(resultado.ultimoBimestreComDados, 2);
  assert.deepEqual(resultado.bimestresComDados, [1, 2]);
});

test("nunca mistura a mesma disciplina entre Fundamental e Médio no ranking", () => {
  const alunos = [aluno("a1", "t-ef"), aluno("a2", "t-em")];
  const notas = [
    nota("a1", "mat", "t-ef", 1, 3), // Fundamental: média baixa
    nota("a2", "mat", "t-em", 1, 9), // Médio: média alta
  ];

  const resultado = buildExecutivo({
    alunos,
    turmas: [turmaFund, turmaMedio],
    disciplinas: [MATEMATICA],
    matriz: MATRIZ,
    todasNotas: notas,
    anoLetivo: 2026,
  });

  const matFund = resultado.rankingDisciplinasFundamental.find((d) => d.id === "mat");
  const matMedio = resultado.rankingDisciplinasMedio.find((d) => d.id === "mat");
  assert.equal(matFund?.media, 3, "Matemática do Fundamental não pode ser afetada pela nota do Médio");
  assert.equal(matMedio?.media, 9, "Matemática do Médio não pode ser afetada pela nota do Fundamental");
});

test("evolucao compara primeiro bimestre com dados vs ultimo; deltaUltimoBimestre compara os dois mais recentes", () => {
  const alunos = [aluno("a1", "t-ef")];
  const notas = [
    nota("a1", "mat", "t-ef", 1, 4),
    nota("a1", "mat", "t-ef", 2, 6),
    nota("a1", "mat", "t-ef", 3, 8),
  ];

  const resultado = buildExecutivo({
    alunos,
    turmas: [turmaFund],
    disciplinas: [MATEMATICA],
    matriz: MATRIZ,
    todasNotas: notas,
    anoLetivo: 2026,
  });

  const mat = resultado.rankingDisciplinasFundamental.find((d) => d.id === "mat");
  assert.equal(mat?.evolucao, 4, "8 (ultimo) - 4 (primeiro) = 4");
  assert.equal(mat?.deltaUltimoBimestre, 2, "8 (ultimo) - 6 (penultimo) = 2");
});

test("conta quem entrou e quem saiu da zona de atenção entre os dois últimos checkpoints com dados", () => {
  const alunos = [aluno("a1", "t-ef"), aluno("a2", "t-ef"), aluno("a3", "t-ef")];
  const disciplinas: Disciplina[] = [
    { id: "d1", nome: "D1" },
    { id: "d2", nome: "D2" },
  ];
  const matriz: MatrizDisciplina[] = [
    { id: "m1", escola_id: "e1", etapa: "EF", codigo: "C01", disciplina_id: "d1", ativo: true },
    { id: "m2", escola_id: "e1", etapa: "EF", codigo: "C02", disciplina_id: "d2", ativo: true },
  ];
  // O risco usa a média ACUMULADA em cada checkpoint, não o bimestre isolado.
  // a1: acumulado bim1 = 8 (sem risco); acumulado bim1+bim2 = (8+1)/2 = 4,5 -> entra em atenção
  // a2: acumulado bim1 = 3 (em atenção); acumulado bim1+bim2 = (3+9)/2 = 6 -> sai da atenção
  const notas: Nota[] = [
    nota("a1", "d1", "t-ef", 1, 8),
    nota("a1", "d1", "t-ef", 2, 1),
    nota("a2", "d1", "t-ef", 1, 3),
    nota("a2", "d1", "t-ef", 2, 9),
    nota("a3", "d1", "t-ef", 1, 8),
    nota("a3", "d1", "t-ef", 2, 8),
  ];

  const resultado = buildExecutivo({
    alunos,
    turmas: [turmaFund],
    disciplinas,
    matriz,
    todasNotas: notas,
    anoLetivo: 2026,
  });

  assert.equal(resultado.entraramNaAtencao, 1);
  assert.equal(resultado.sairamDaAtencao, 1);
});

test("media anual acumulada considera todas as notas do ano ate o ultimo bimestre com dados, nao so o snapshot do ultimo bimestre", () => {
  const alunos = [aluno("a1", "t-ef")];
  const notas = [
    nota("a1", "mat", "t-ef", 1, 2),
    nota("a1", "mat", "t-ef", 2, 10),
  ];

  const resultado = buildExecutivo({
    alunos,
    turmas: [turmaFund],
    disciplinas: [MATEMATICA],
    matriz: MATRIZ,
    todasNotas: notas,
    anoLetivo: 2026,
  });

  // snapshot isolado do bimestre 2 seria 10; a media acumulada do ano e (2+10)/2 = 6
  assert.equal(resultado.snapshotAtual.media, 10);
  assert.equal(resultado.mediaAnualAcumulada, 6);
});

test("gerarObservacoes: com so 1 bimestre, descreve o estado atual sem comparar com nada", () => {
  const alunos = [aluno("a1", "t-ef")];
  const notas = [nota("a1", "mat", "t-ef", 1, 8)];
  const resultado = buildExecutivo({
    alunos, turmas: [turmaFund], disciplinas: [MATEMATICA], matriz: MATRIZ, todasNotas: notas, anoLetivo: 2026,
  });
  const obs = gerarObservacoes(resultado);
  assert.ok(obs[0].includes("1º bim"), "primeira frase deve descrever o bimestre atual: " + obs[0]);
  assert.ok(!obs.some((o) => o.toLowerCase().includes("bimestre anterior")), "nao pode comparar com bimestre anterior quando so ha 1");
});

test("gerarObservacoes: com 2 bimestres, compara com o anterior", () => {
  const alunos = [aluno("a1", "t-ef")];
  const notas = [nota("a1", "mat", "t-ef", 1, 5), nota("a1", "mat", "t-ef", 2, 9)];
  const resultado = buildExecutivo({
    alunos, turmas: [turmaFund], disciplinas: [MATEMATICA], matriz: MATRIZ, todasNotas: notas, anoLetivo: 2026,
  });
  const obs = gerarObservacoes(resultado);
  assert.ok(obs.some((o) => o.includes("cresceu")), "deveria detectar crescimento: " + JSON.stringify(obs));
});

test("gerarObservacoes: com 4 bimestres, gera analise anual (nao fica preso no 1o bimestre)", () => {
  const alunos = [aluno("a1", "t-ef")];
  const notas = [
    nota("a1", "mat", "t-ef", 1, 4),
    nota("a1", "mat", "t-ef", 2, 5),
    nota("a1", "mat", "t-ef", 3, 6),
    nota("a1", "mat", "t-ef", 4, 8),
  ];
  const resultado = buildExecutivo({
    alunos, turmas: [turmaFund], disciplinas: [MATEMATICA], matriz: MATRIZ, todasNotas: notas, anoLetivo: 2026,
  });
  assert.equal(resultado.ultimoBimestreComDados, 4);
  const obs = gerarObservacoes(resultado);
  assert.ok(obs.some((o) => o.toLowerCase().includes("ao longo do ano")), "deveria gerar analise anual: " + JSON.stringify(obs));
});
