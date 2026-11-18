export type ZeroPolicy = "reject" | "grade";
export type SourceName = "b1" | "b2";

export type ImportStudent = {
  id: number;
  name: string;
  grades: Record<string, number | "TR">;
  isAttention: boolean;
};

export type ImportClassRoom = {
  id: string;
  name: string;
  level: "EF" | "EM";
  students: ImportStudent[];
  subjects: Array<{ code: string; name: string }>;
  totalActive: number;
};

export type ImportOptions = {
  source: SourceName;
  schoolId: string;
  year: number;
  term: number;
  zeroPolicy: ZeroPolicy;
  apply: boolean;
  operator?: string;
  confirmation?: string;
  backupReference?: string;
  reportPath?: string;
};

export type ValidatedDataset = {
  classes: ImportClassRoom[];
  matrix: Array<{ group: string; code: string; subjectName: string; normalizedName: string }>;
  summary: {
    classes: number;
    students: number;
    activeStudents: number;
    transferredStudents: number;
    matrixEntries: number;
    grades: number;
    zeroGrades: number;
  };
  warnings: string[];
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getSchoolYear(className: string): number {
  const match = className.match(/(\d+)/);
  if (!match) throw new Error(`Não foi possível identificar o ano/série da turma: ${className}`);
  return Number(match[1]);
}

export function getPedagogicalGroup(classroom: Pick<ImportClassRoom, "name" | "level">): string {
  const year = getSchoolYear(classroom.name);
  if (classroom.level === "EF" && [6, 9].includes(year)) return "FUND_69";
  if (classroom.level === "EF" && [7, 8].includes(year)) return "FUND_78";
  if (classroom.level === "EM" && year === 1) return "MEDIO_1";
  if (classroom.level === "EM" && year === 2) return "MEDIO_12";
  if (classroom.level === "EM" && year === 3) return "MEDIO_3";
  throw new Error(`Turma sem grupo pedagógico válido: ${classroom.name} (${classroom.level})`);
}

function readValue(argv: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = argv.find((item) => item.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(`--${name}`);
  if (index >= 0) return argv[index + 1];
  return undefined;
}

export function expectedConfirmation(options: Pick<ImportOptions, "schoolId" | "year" | "term">): string {
  return `IMPORTAR-${options.schoolId}-${options.year}-B${options.term}`;
}

export function parseImportOptions(argv: string[]): ImportOptions {
  const source = readValue(argv, "source") as SourceName | undefined;
  const schoolId = readValue(argv, "school");
  const year = Number(readValue(argv, "year"));
  const term = Number(readValue(argv, "term"));
  const zeroPolicy = (readValue(argv, "zero-policy") ?? "reject") as ZeroPolicy;
  const apply = argv.includes("--apply");

  if (source !== "b1" && source !== "b2") throw new Error("Informe --source=b1 ou --source=b2");
  if (!schoolId || !UUID_PATTERN.test(schoolId)) throw new Error("Informe um UUID válido em --school");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("Informe --year entre 2000 e 2100");
  if (!Number.isInteger(term) || term < 1 || term > 4) throw new Error("Informe --term entre 1 e 4");
  if (zeroPolicy !== "reject" && zeroPolicy !== "grade") {
    throw new Error("--zero-policy deve ser reject ou grade");
  }

  const options: ImportOptions = {
    source,
    schoolId,
    year,
    term,
    zeroPolicy,
    apply,
    operator: readValue(argv, "operator"),
    confirmation: readValue(argv, "confirm"),
    backupReference: readValue(argv, "backup-reference"),
    reportPath: readValue(argv, "report"),
  };

  if (apply) {
    if (!options.operator || !options.operator.includes("@")) {
      throw new Error("Aplicação exige --operator com o e-mail do responsável");
    }
    if (!options.backupReference) {
      throw new Error("Aplicação exige --backup-reference com a identificação do backup já validado");
    }
    if (options.confirmation !== expectedConfirmation(options)) {
      throw new Error(`Confirmação inválida. Use --confirm=${expectedConfirmation(options)}`);
    }
  }

  return options;
}

export function validateDataset(classes: ImportClassRoom[], zeroPolicy: ZeroPolicy): ValidatedDataset {
  if (classes.length === 0) throw new Error("A fonte não contém turmas");

  const errors: string[] = [];
  const warnings: string[] = [];
  const classIds = new Set<string>();
  const classNames = new Set<string>();
  const matrixByKey = new Map<string, { group: string; code: string; subjectName: string; normalizedName: string }>();
  let students = 0;
  let activeStudents = 0;
  let transferredStudents = 0;
  let grades = 0;
  let zeroGrades = 0;

  for (const classroom of classes) {
    const classLabel = classroom.name || classroom.id || "turma sem identificação";
    if (!classroom.id.trim()) errors.push(`${classLabel}: identificador vazio`);
    if (!classroom.name.trim()) errors.push(`${classLabel}: nome vazio`);
    if (classIds.has(classroom.id)) errors.push(`${classLabel}: identificador de turma duplicado (${classroom.id})`);
    if (classNames.has(normalizeText(classroom.name))) errors.push(`${classLabel}: nome de turma duplicado`);
    classIds.add(classroom.id);
    classNames.add(normalizeText(classroom.name));

    let group: string;
    try {
      group = getPedagogicalGroup(classroom);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      continue;
    }

    const subjectCodes = new Set<string>();
    for (const subject of classroom.subjects) {
      const code = subject.code.trim().toUpperCase();
      const subjectName = subject.name.trim();
      if (!code || !subjectName) errors.push(`${classLabel}: disciplina com código ou nome vazio`);
      if (subjectCodes.has(code)) errors.push(`${classLabel}: código de disciplina duplicado (${code})`);
      subjectCodes.add(code);

      const key = `${group}:${code}`;
      const normalizedName = normalizeText(subjectName);
      const current = matrixByKey.get(key);
      if (current && current.normalizedName !== normalizedName) {
        errors.push(`${key}: conflito entre "${current.subjectName}" e "${subjectName}"`);
      } else if (!current) {
        matrixByKey.set(key, { group, code, subjectName, normalizedName });
      }
    }

    const callNumbers = new Set<number>();
    let classActiveStudents = 0;
    for (const student of classroom.students) {
      students++;
      if (!Number.isInteger(student.id) || student.id <= 0) errors.push(`${classLabel}: número de chamada inválido (${student.id})`);
      if (callNumbers.has(student.id)) errors.push(`${classLabel}: número de chamada duplicado (${student.id})`);
      callNumbers.add(student.id);
      if (!student.name.trim()) errors.push(`${classLabel}/${student.id}: nome do aluno vazio`);

      const gradeKeys = Object.keys(student.grades).map((code) => code.toUpperCase());
      for (const code of subjectCodes) {
        if (!gradeKeys.includes(code)) errors.push(`${classLabel}/${student.id}: falta a nota de ${code}`);
      }
      for (const code of gradeKeys) {
        if (!subjectCodes.has(code)) errors.push(`${classLabel}/${student.id}: disciplina desconhecida ${code}`);
      }

      const values = Object.values(student.grades);
      const transferValues = values.filter((value) => value === "TR").length;
      if (transferValues > 0 && transferValues !== values.length) {
        errors.push(`${classLabel}/${student.id}: situação TR misturada com notas`);
      }
      const transferred = values.length > 0 && transferValues === values.length;
      if (transferred) {
        transferredStudents++;
        continue;
      }

      activeStudents++;
      classActiveStudents++;
      for (const value of values) {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 10) {
          errors.push(`${classLabel}/${student.id}: nota inválida (${String(value)})`);
          continue;
        }
        if (value === 0) zeroGrades++;
        grades++;
      }
    }

    if (classroom.totalActive !== classActiveStudents) {
      warnings.push(`${classLabel}: totalActive=${classroom.totalActive}, alunos ativos calculados=${classActiveStudents}`);
    }
  }

  if (zeroPolicy === "reject" && zeroGrades > 0) {
    errors.push(`A fonte contém ${zeroGrades} notas zero. Revise a fonte ou confirme que zero é nota real com --zero-policy=grade`);
  }
  if (errors.length > 0) throw new Error(`Fonte rejeitada:\n- ${errors.join("\n- ")}`);

  return {
    classes,
    matrix: [...matrixByKey.values()],
    summary: {
      classes: classes.length,
      students,
      activeStudents,
      transferredStudents,
      matrixEntries: matrixByKey.size,
      grades,
      zeroGrades,
    },
    warnings,
  };
}
