import assert from "node:assert/strict";
import test from "node:test";
import {
  expectedConfirmation,
  getPedagogicalGroup,
  parseImportOptions,
  validateDataset,
  type ImportClassRoom,
} from "./import-school-data-lib";

const schoolId = "00000000-0000-4000-8000-000000000001";

function dataset(grade: number | "TR" = 7): ImportClassRoom[] {
  return [{
    id: "1A",
    name: "1ª Série A",
    level: "EM",
    totalActive: grade === "TR" ? 0 : 1,
    subjects: [{ code: "C01", name: "Arte" }],
    students: [{ id: 1, name: "ALUNO TESTE", grades: { C01: grade }, isAttention: false }],
  }];
}

test("separa corretamente a 1ª e a 2ª série do Ensino Médio", () => {
  assert.equal(getPedagogicalGroup({ name: "1ª Série A", level: "EM" }), "MEDIO_1");
  assert.equal(getPedagogicalGroup({ name: "2ª Série A", level: "EM" }), "MEDIO_12");
  assert.equal(getPedagogicalGroup({ name: "3ª Série A", level: "EM" }), "MEDIO_3");
});

test("a execução padrão é somente simulação", () => {
  const options = parseImportOptions(["--source=b1", `--school=${schoolId}`, "--year=2026", "--term=1"]);
  assert.equal(options.apply, false);
  assert.equal(options.zeroPolicy, "reject");
});

test("aplicação exige operador, backup e frase exata", () => {
  const base = { schoolId, year: 2026, term: 1 };
  assert.throws(() => parseImportOptions(["--source=b1", `--school=${schoolId}`, "--year=2026", "--term=1", "--apply"]));
  const options = parseImportOptions([
    "--source=b1", `--school=${schoolId}`, "--year=2026", "--term=1", "--apply",
    "--operator=responsavel@escola.test", "--backup-reference=backup-001",
    `--confirm=${expectedConfirmation(base)}`,
  ]);
  assert.equal(options.apply, true);
});

test("bloqueia zero por padrão e aceita quando declarado como nota real", () => {
  assert.throws(() => validateDataset(dataset(0), "reject"), /notas zero/);
  const validated = validateDataset(dataset(0), "grade");
  assert.equal(validated.summary.zeroGrades, 1);
  assert.equal(validated.summary.grades, 1);
});

test("bloqueia situação TR misturada com nota", () => {
  const source = dataset();
  source[0].subjects.push({ code: "C02", name: "Matemática" });
  source[0].students[0].grades = { C01: "TR", C02: 7 };
  assert.throws(() => validateDataset(source, "reject"), /TR misturada/);
});

test("bloqueia códigos de matriz com disciplinas conflitantes", () => {
  const source = dataset();
  source.push({ ...dataset()[0], id: "1B", name: "1ª Série B", subjects: [{ code: "C01", name: "Matemática" }] });
  assert.throws(() => validateDataset(source, "reject"), /conflito/);
});
