// Dados extraídos das Atas de Conselho de Classe - 1º Bimestre 2026
// EE Carlos Bernardes Staut - Ribeirão dos Índios, SP

export type Student = {
  id: number;
  name: string;
  grades: Record<string, number | "TR">;
  isAttention: boolean;
};

export type ClassRoom = {
  id: string;
  name: string;
  level: "EF" | "EM";
  students: Student[];
  subjects: { code: string; name: string }[];
  totalActive: number;
};

export type PedagogicalLevel = "critical" | "basic" | "adequate" | "advanced";

export const PEDAGOGICAL_LEVELS: Record<
  PedagogicalLevel,
  { min: number; max: number; label: string; color: string; bgClass: string; textClass: string }
> = {
  critical: { min: 1, max: 4, label: "Abaixo do Básico", color: "#ef4444", bgClass: "bg-critical", textClass: "text-critical" },
  basic: { min: 5, max: 6, label: "Básico", color: "#eab308", bgClass: "bg-warning", textClass: "text-warning" },
  adequate: { min: 7, max: 8, label: "Adequado", color: "#22c55e", bgClass: "bg-success", textClass: "text-success" },
  advanced: { min: 9, max: 10, label: "Avançado", color: "#3b82f6", bgClass: "bg-advanced", textClass: "text-advanced" },
};

export function getPedagogicalLevel(grade: number): PedagogicalLevel {
  if (grade <= 4) return "critical";
  if (grade <= 6) return "basic";
  if (grade <= 8) return "adequate";
  return "advanced";
}

export function getPedagogicalColor(grade: number): string {
  const level = getPedagogicalLevel(grade);
  return PEDAGOGICAL_LEVELS[level].color;
}

// 6º Ano - Ensino Fundamental
const sextoAno: ClassRoom = {
  id: "6A",
  name: "6º Ano A",
  level: "EF",
  totalActive: 18,
  subjects: [
    { code: "C01", name: "Arte" },
    { code: "C02", name: "Ciências" },
    { code: "C03", name: "OE - Língua Portuguesa" },
    { code: "C04", name: "Educação Física" },
    { code: "C05", name: "Geografia" },
    { code: "C06", name: "História" },
    { code: "C07", name: "Língua Inglesa" },
    { code: "C08", name: "Língua Portuguesa" },
    { code: "C09", name: "Matemática" },
    { code: "C10", name: "Projeto de Vida" },
    { code: "C11", name: "Redação e Leitura" },
    { code: "C12", name: "OE - Matemática" },
  ],
  students: [
    { id: 1, name: "ALICIA MARIA GEA SILVA", grades: { C01: 9, C02: 10, C03: 7, C04: 7, C05: 9, C06: 8, C07: 8, C08: 7, C09: 8, C10: 9, C11: 7, C12: 8 }, isAttention: false },
    { id: 2, name: "ANA BEATRIZ SOUZA DA SILVA", grades: { C01: 7, C02: 3, C03: 5, C04: 7, C05: 4, C06: 5, C07: 4, C08: 4, C09: 3, C10: 7, C11: 5, C12: 3 }, isAttention: true },
    { id: 3, name: "ARTHUR CÉSAR DANTAS DA SILVA", grades: { C01: 5, C02: 5, C03: 5, C04: 8, C05: 3, C06: 3, C07: 2, C08: 1, C09: 4, C10: 5, C11: 3, C12: 4 }, isAttention: true },
    { id: 4, name: "DAVI LUCAS SOUZA DE OLIVEIRA", grades: { C01: 5, C02: 5, C03: 1, C04: 5, C05: 3, C06: 5, C07: 4, C08: 3, C09: 4, C10: 5, C11: 2, C12: 4 }, isAttention: true },
    { id: 5, name: "DAVI LUIZ AQUINO DE ARAUJO", grades: { C01: 5, C02: 4, C03: 3, C04: 7, C05: 3, C06: 3, C07: 2, C08: 2, C09: 3, C10: 5, C11: 3, C12: 3 }, isAttention: true },
    { id: 6, name: "ELOA VITORIA DOS SANTOS", grades: { C01: 6, C02: 5, C03: 5, C04: 7, C05: 5, C06: 6, C07: 4, C08: 3, C09: 4, C10: 6, C11: 5, C12: 6 }, isAttention: true },
    { id: 7, name: "EMANUELLY DOS SANTOS DIAS", grades: { C01: 8, C02: 9, C03: 8, C04: 8, C05: 9, C06: 9, C07: 8, C08: 7, C09: 9, C10: 8, C11: 8, C12: 9 }, isAttention: false },
    { id: 8, name: "FELIX GABRIEL DE SOUZA GIL", grades: { C01: 6, C02: 8, C03: 5, C04: 8, C05: 5, C06: 6, C07: 6, C08: 5, C09: 6, C10: 6, C11: 5, C12: 7 }, isAttention: false },
    { id: 9, name: "GABRIEL HENRIQUE DIAS DA SILVA", grades: { C01: 5, C02: 4, C03: 3, C04: 7, C05: 3, C06: 4, C07: 2, C08: 3, C09: 4, C10: 4, C11: 4, C12: 4 }, isAttention: true },
    { id: 10, name: "ITALO GABRIEL DEFACIO DA SILVA", grades: { C01: 5, C02: 6, C03: 4, C04: 7, C05: 5, C06: 5, C07: 5, C08: 3, C09: 4, C10: 5, C11: 5, C12: 6 }, isAttention: true },
    { id: 11, name: "JEAN CARLOS DA SILVA CANCIAN", grades: { C01: 6, C02: 5, C03: 4, C04: 5, C05: 5, C06: 4, C07: 5, C08: 4, C09: 3, C10: 6, C11: 5, C12: 5 }, isAttention: true },
    { id: 12, name: "JOÃO VITOR BARBOSA FIORI", grades: { C01: 6, C02: 8, C03: 6, C04: 7, C05: 7, C06: 7, C07: 6, C08: 6, C09: 7, C10: 6, C11: 7, C12: 6 }, isAttention: false },
    { id: 13, name: "JULIERME DA SILVA FERREIRA", grades: { C01: 5, C02: 5, C03: 3, C04: 5, C05: 5, C06: 4, C07: 4, C08: 3, C09: 5, C10: 5, C11: 5, C12: 5 }, isAttention: true },
    { id: 14, name: "LEONARDO APARECIDO DOS SANTOS", grades: { C01: 5, C02: 5, C03: 3, C04: 7, C05: 4, C06: 4, C07: 2, C08: 3, C09: 3, C10: 5, C11: 4, C12: 4 }, isAttention: true },
    { id: 15, name: "MARIA CLARA CRUZ TOLEDO", grades: { C01: 6, C02: 9, C03: 5, C04: 7, C05: 7, C06: 6, C07: 6, C08: 5, C09: 5, C10: 5, C11: 7, C12: 6 }, isAttention: false },
    { id: 16, name: "MARINA SANTOS ARAUJO", grades: { C01: 7, C02: 8, C03: 4, C04: 7, C05: 9, C06: 8, C07: 6, C08: 6, C09: 7, C10: 7, C11: 7, C12: 7 }, isAttention: true },
    { id: 17, name: "OLIVIA APARECIDA DE LIMA CESTARI", grades: { C01: 6, C02: 3, C03: 5, C04: 7, C05: 4, C06: 5, C07: 6, C08: 4, C09: 4, C10: 5, C11: 5, C12: 5 }, isAttention: true },
    { id: 18, name: "RODRIGO BRESSA REIS", grades: { C01: 8, C02: 8, C03: 6, C04: 9, C05: 7, C06: 7, C07: 7, C08: 5, C09: 7, C10: 7, C11: 6, C12: 6 }, isAttention: false },
  ],
};

// 7º Ano - Ensino Fundamental
const setimoAno: ClassRoom = {
  id: "7A",
  name: "7º Ano A",
  level: "EF",
  totalActive: 14,
  subjects: [
    { code: "C01", name: "Arte" },
    { code: "C02", name: "Ciências" },
    { code: "C03", name: "Tecnologia e Inovação" },
    { code: "C04", name: "Educação Física" },
    { code: "C05", name: "Geografia" },
    { code: "C06", name: "História" },
    { code: "C07", name: "Língua Inglesa" },
    { code: "C08", name: "Língua Portuguesa" },
    { code: "C09", name: "Matemática" },
    { code: "C10", name: "Projeto de Vida" },
    { code: "C11", name: "Redação e Leitura" },
    { code: "C12", name: "Educação Financeira" },
  ],
  students: [
    { id: 1, name: "ANALLU VIVIAN OLIVEIRA", grades: { C01: 8, C02: 7, C03: 9, C04: 10, C05: 8, C06: 8, C07: 8, C08: 7, C09: 7, C10: 8, C11: 8, C12: 8 }, isAttention: false },
    { id: 2, name: "DIEGO AQUINO DOS SANTOS", grades: { C01: 6, C02: 5, C03: 6, C04: 9, C05: 5, C06: 5, C07: 4, C08: 5, C09: 5, C10: 6, C11: 4, C12: 6 }, isAttention: true },
    { id: 3, name: "GUILHERME AQUINO DE ARAUJO", grades: { C01: 6, C02: 6, C03: 5, C04: 10, C05: 4, C06: 4, C07: 3, C08: 3, C09: 3, C10: 5, C11: 3, C12: 5 }, isAttention: true },
    { id: 4, name: "JOÃO GABRIEL LOPES DA SILVA", grades: { C01: 6, C02: 4, C03: 6, C04: 9, C05: 4, C06: 5, C07: 6, C08: 4, C09: 3, C10: 6, C11: 4, C12: 6 }, isAttention: true },
    { id: 5, name: "JOÃO MIGUEL ALMEIDA VIEIRA", grades: { C01: 7, C02: 8, C03: 7, C04: 8, C05: 4, C06: 4, C07: 4, C08: 4, C09: 3, C10: 6, C11: 5, C12: 3 }, isAttention: true },
    { id: 6, name: "MIGUEL GONÇALVES DE LIMA", grades: { C01: 7, C02: 9, C03: 8, C04: 8, C05: 8, C06: 8, C07: 7, C08: 8, C09: 8, C10: 7, C11: 9, C12: 8 }, isAttention: false },
    { id: 7, name: "MIGUEL LIMA NEVES", grades: { C01: 7, C02: 6, C03: 8, C04: 8, C05: 5, C06: 6, C07: 4, C08: 5, C09: 5, C10: 7, C11: 6, C12: 7 }, isAttention: true },
    { id: 8, name: "NEYMAR HENRIQUE FERREIRA DA SILVA", grades: { C01: 6, C02: 5, C03: 9, C04: 9, C05: 6, C06: 7, C07: 5, C08: 6, C09: 5, C10: 7, C11: 6, C12: 7 }, isAttention: false },
    { id: 9, name: "PAULA FERNANDA DA SILVA", grades: { C01: 7, C02: 6, C03: 7, C04: 8, C05: 4, C06: 5, C07: 5, C08: 3, C09: 3, C10: 7, C11: 5, C12: 6 }, isAttention: true },
    { id: 10, name: "PEDRO AUGUSTO DOS SANTOS PAULO", grades: { C01: 8, C02: 7, C03: 7, C04: 7, C05: 4, C06: 5, C07: 8, C08: 6, C09: 6, C10: 7, C11: 8, C12: 7 }, isAttention: true },
    { id: 11, name: "PEDRO FERREIRA DOS SANTOS", grades: { C01: 8, C02: 8, C03: 8, C04: 9, C05: 7, C06: 8, C07: 8, C08: 7, C09: 8, C10: 8, C11: 8, C12: 8 }, isAttention: false },
    { id: 12, name: "PEDRO HENRIQUE AQUINO FERNANDES", grades: { C01: 9, C02: 9, C03: 9, C04: 10, C05: 9, C06: 9, C07: 8, C08: 9, C09: 9, C10: 9, C11: 8, C12: 9 }, isAttention: false },
    { id: 13, name: "SAMUEL JOSÉ CANCIAN ALTOMAR", grades: { C01: 4, C02: 4, C03: 5, C04: 10, C05: 5, C06: 4, C07: 3, C08: 5, C09: 4, C10: 5, C11: 4, C12: 5 }, isAttention: true },
    { id: 14, name: "WELLINGTON GUILHERME DA COSTA BORGES", grades: { C01: 4, C02: 4, C03: 4, C04: 7, C05: 3, C06: 4, C07: 2, C08: 2, C09: 2, C10: 4, C11: 3, C12: 5 }, isAttention: true },
  ],
};

// 8º Ano - Ensino Fundamental
const oitavoAno: ClassRoom = {
  id: "8A",
  name: "8º Ano A",
  level: "EF",
  totalActive: 18,
  subjects: [
    { code: "C01", name: "Arte" },
    { code: "C02", name: "Ciências" },
    { code: "C03", name: "Tecnologia e Inovação" },
    { code: "C04", name: "Educação Física" },
    { code: "C05", name: "Geografia" },
    { code: "C06", name: "História" },
    { code: "C07", name: "Língua Inglesa" },
    { code: "C08", name: "Língua Portuguesa" },
    { code: "C09", name: "Matemática" },
    { code: "C10", name: "Projeto de Vida" },
    { code: "C11", name: "Redação e Leitura" },
    { code: "C12", name: "Educação Financeira" },
  ],
  students: [
    { id: 1, name: "DANIEL DA SILVA MORAIS", grades: { C01: 8, C02: 9, C03: 9, C04: 9, C05: 8, C06: 8, C07: 6, C08: 7, C09: 6, C10: 8, C11: 8, C12: 7 }, isAttention: false },
    { id: 2, name: "EDUARDO DOS SANTOS PEREIRA", grades: { C01: 5, C02: 5, C03: 5, C04: 5, C05: 5, C06: 5, C07: 5, C08: 5, C09: 5, C10: 5, C11: 5, C12: 5 }, isAttention: false },
    { id: 3, name: "EMANUELLY RODRIGUES TAGLIARI MAGRO", grades: { C01: 7, C02: 7, C03: 8, C04: 8, C05: 8, C06: 7, C07: 7, C08: 7, C09: 4, C10: 8, C11: 8, C12: 6 }, isAttention: true },
    { id: 4, name: "ERICK MATHEUS DA SILVA SIMA", grades: { C01: 5, C02: 5, C03: 5, C04: 7, C05: 3, C06: 5, C07: 4, C08: 3, C09: 3, C10: 5, C11: 4, C12: 3 }, isAttention: true },
    { id: 5, name: "GILDO ARTHUR SILVA DE SOUZA", grades: { C01: 6, C02: 5, C03: 6, C04: 6, C05: 6, C06: 5, C07: 6, C08: 6, C09: 5, C10: 6, C11: 6, C12: 5 }, isAttention: false },
    { id: 6, name: "IURY DEFENDI SILVA", grades: { C01: 7, C02: 7, C03: 6, C04: 9, C05: 6, C06: 7, C07: 4, C08: 5, C09: 4, C10: 7, C11: 6, C12: 6 }, isAttention: true },
    { id: 7, name: "JULIO CESAR ROCHA DOS SANTOS", grades: { C01: 7, C02: 7, C03: 7, C04: 7, C05: 5, C06: 6, C07: 4, C08: 5, C09: 4, C10: 7, C11: 7, C12: 4 }, isAttention: true },
    { id: 8, name: "LARA DANTAS DA SILVA", grades: { C01: 6, C02: 7, C03: 6, C04: 8, C05: 4, C06: 3, C07: 4, C08: 4, C09: 3, C10: 6, C11: 6, C12: 4 }, isAttention: true },
    { id: 9, name: "LIVIA MARIA GOIS REGO", grades: { C01: 6, C02: 6, C03: 7, C04: 7, C05: 5, C06: 5, C07: 4, C08: 4, C09: 3, C10: 7, C11: 5, C12: 3 }, isAttention: true },
    { id: 10, name: "MIGUEL VOLPE DA SILVA CACHEFFO", grades: { C01: 9, C02: 9, C03: 9, C04: 8, C05: 8, C06: 8, C07: 6, C08: 8, C09: 7, C10: 9, C11: 8, C12: 8 }, isAttention: false },
    { id: 11, name: "NICOLAS MUNIZ SANTOS CANCIAN", grades: { C01: 9, C02: 9, C03: 9, C04: 9, C05: 10, C06: 9, C07: 7, C08: 9, C09: 8, C10: 10, C11: 9, C12: 8 }, isAttention: false },
    { id: 12, name: "NICOLLAS MASSENA AQUINO", grades: { C01: 9, C02: 9, C03: 9, C04: 8, C05: 9, C06: 8, C07: 6, C08: 7, C09: 8, C10: 9, C11: 8, C12: 8 }, isAttention: false },
    { id: 13, name: "NICOLLY NERES DOS SANTOS", grades: { C01: 7, C02: 8, C03: 7, C04: 7, C05: 5, C06: 7, C07: 5, C08: 6, C09: 3, C10: 7, C11: 7, C12: 4 }, isAttention: true },
    { id: 14, name: "RALFH GABRIEL SOUZA SANTOS", grades: { C01: 8, C02: 9, C03: 8, C04: 7, C05: 8, C06: 8, C07: 8, C08: 8, C09: 8, C10: 8, C11: 8, C12: 8 }, isAttention: false },
    { id: 15, name: "RAPHAELY BITTENCOURT ARAÚJO", grades: { C01: 7, C02: 8, C03: 7, C04: 7, C05: 6, C06: 6, C07: 4, C08: 6, C09: 4, C10: 7, C11: 6, C12: 6 }, isAttention: true },
    { id: 16, name: "RENAN DE OLIVEIRA REGO", grades: { C01: 6, C02: 5, C03: 6, C04: 6, C05: 5, C06: 5, C07: 4, C08: 4, C09: 3, C10: 6, C11: 5, C12: 4 }, isAttention: true },
    { id: 17, name: "YAGO DANIEL DEFACIO DA SILVA", grades: { C01: 6, C02: 7, C03: 7, C04: 7, C05: 5, C06: 7, C07: 5, C08: 6, C09: 5, C10: 7, C11: 7, C12: 5 }, isAttention: false },
    { id: 18, name: "YANDRA GABRIELLA CONCEIÇÃO DOS SANTOS", grades: { C01: 6, C02: 7, C03: 7, C04: 7, C05: 4, C06: 7, C07: 3, C08: 5, C09: 4, C10: 7, C11: 3, C12: 5 }, isAttention: true },
  ],
};

// 9º Ano - Ensino Fundamental
const nonoAno: ClassRoom = {
  id: "9A",
  name: "9º Ano A",
  level: "EF",
  totalActive: 19,
  subjects: [
    { code: "C01", name: "Arte" },
    { code: "C02", name: "Ciências" },
    { code: "C03", name: "OE - Língua Portuguesa" },
    { code: "C04", name: "Educação Física" },
    { code: "C05", name: "Geografia" },
    { code: "C06", name: "História" },
    { code: "C07", name: "Língua Inglesa" },
    { code: "C08", name: "Língua Portuguesa" },
    { code: "C09", name: "Matemática" },
    { code: "C10", name: "Projeto de Vida" },
    { code: "C11", name: "Redação e Leitura" },
    { code: "C12", name: "OE - Matemática" },
  ],
  students: [
    { id: 1, name: "ANA JULIA ARAUJO DE SOUZA", grades: { C01: 4, C02: 3, C03: 4, C04: 5, C05: 3, C06: 4, C07: 3, C08: 3, C09: 2, C10: 5, C11: 4, C12: 2 }, isAttention: true },
    { id: 2, name: "ANA LIVIA REGIANI DO PRADO", grades: { C01: "TR", C02: "TR", C03: "TR", C04: "TR", C05: "TR", C06: "TR", C07: "TR", C08: "TR", C09: "TR", C10: "TR", C11: "TR", C12: "TR" }, isAttention: false },
    { id: 3, name: "ANDREY PIERRE DE LIMA CESTARI", grades: { C01: 5, C02: 5, C03: 4, C04: 8, C05: 6, C06: 5, C07: 4, C08: 4, C09: 3, C10: 5, C11: 5, C12: 4 }, isAttention: true },
    { id: 4, name: "BETTINA PASCHOALOTTO DOS SANTOS", grades: { C01: 6, C02: 4, C03: 6, C04: 7, C05: 4, C06: 4, C07: 5, C08: 6, C09: 4, C10: 6, C11: 6, C12: 4 }, isAttention: true },
    { id: 5, name: "DAVI FERNANDES CONSOLI", grades: { C01: 8, C02: 7, C03: 7, C04: 10, C05: 9, C06: 8, C07: 7, C08: 8, C09: 5, C10: 8, C11: 7, C12: 7 }, isAttention: false },
    { id: 6, name: "ELIAS GABRIEL BATISTA DE SOUZA", grades: { C01: 4, C02: 5, C03: 4, C04: 9, C05: 6, C06: 5, C07: 4, C08: 6, C09: 4, C10: 5, C11: 5, C12: 5 }, isAttention: true },
    { id: 7, name: "ELOÁ ALVES DE OLIVEIRA", grades: { C01: 8, C02: 7, C03: 8, C04: 8, C05: 8, C06: 8, C07: 7, C08: 9, C09: 5, C10: 8, C11: 9, C12: 5 }, isAttention: false },
    { id: 8, name: "ENZO GABRIEL GOIS FURINI", grades: { C01: 7, C02: 4, C03: 5, C04: 8, C05: 5, C06: 4, C07: 4, C08: 5, C09: 3, C10: 7, C11: 6, C12: 4 }, isAttention: true },
    { id: 9, name: "FELIPE HENRIQUE AQUINO DOMINGOS", grades: { C01: 7, C02: 5, C03: 6, C04: 10, C05: 6, C06: 5, C07: 5, C08: 6, C09: 4, C10: 8, C11: 7, C12: 5 }, isAttention: true },
    { id: 10, name: "GABRIEL ANTÔNIO CESTARI PACHECO", grades: { C01: 5, C02: 3, C03: 4, C04: 7, C05: 3, C06: 4, C07: 3, C08: 3, C09: 3, C10: 5, C11: 5, C12: 2 }, isAttention: true },
    { id: 11, name: "GABRYEL BATISTA DOS SANTOS", grades: { C01: 6, C02: 6, C03: 5, C04: 7, C05: 5, C06: 5, C07: 5, C08: 6, C09: 3, C10: 6, C11: 6, C12: 4 }, isAttention: true },
    { id: 12, name: "ISABELLA SOUZA FERREIRA", grades: { C01: 8, C02: 6, C03: 6, C04: 7, C05: 6, C06: 5, C07: 6, C08: 7, C09: 4, C10: 8, C11: 8, C12: 6 }, isAttention: true },
    { id: 13, name: "JOSE HENRIQUE RABELO DA SILVA", grades: { C01: 8, C02: 6, C03: 7, C04: 10, C05: 8, C06: 6, C07: 6, C08: 7, C09: 5, C10: 8, C11: 7, C12: 6 }, isAttention: false },
    { id: 14, name: "KAUÃ HENRIQUE BENITE DOS SANTOS", grades: { C01: 7, C02: 4, C03: 5, C04: 9, C05: 6, C06: 7, C07: 5, C08: 7, C09: 5, C10: 7, C11: 7, C12: 6 }, isAttention: true },
    { id: 15, name: "LEONARDO SILVA DOMINGOS ROSA", grades: { C01: 5, C02: 5, C03: 6, C04: 5, C05: 6, C06: 5, C07: 7, C08: 7, C09: 3, C10: 6, C11: 7, C12: 4 }, isAttention: true },
    { id: 16, name: "MARIA FERNANDA DOS SANTOS CELLIS", grades: { C01: 5, C02: 3, C03: 3, C04: 5, C05: 5, C06: 5, C07: 4, C08: 4, C09: 3, C10: 5, C11: 6, C12: 4 }, isAttention: true },
    { id: 17, name: "MIGUEL JUNIOR BEIJAMIM DE ALMEIDA", grades: { C01: 5, C02: 4, C03: 2, C04: 8, C05: 4, C06: 4, C07: 3, C08: 2, C09: 2, C10: 8, C11: 5, C12: 3 }, isAttention: true },
    { id: 18, name: "MIRELLA SALES DOS SANTOS", grades: { C01: 8, C02: 7, C03: 6, C04: 8, C05: 7, C06: 7, C07: 5, C08: 8, C09: 5, C10: 8, C11: 8, C12: 7 }, isAttention: false },
    { id: 19, name: "PEDRO HENRIQUE ALONSO REGO", grades: { C01: "TR", C02: "TR", C03: "TR", C04: "TR", C05: "TR", C06: "TR", C07: "TR", C08: "TR", C09: "TR", C10: "TR", C11: "TR", C12: "TR" }, isAttention: false },
    { id: 20, name: "VALENTINA MATHEUS DA SILVA", grades: { C01: 6, C02: 4, C03: 3, C04: 7, C05: 4, C06: 4, C07: 5, C08: 5, C09: 2, C10: 6, C11: 6, C12: 5 }, isAttention: true },
    { id: 21, name: "MIRELY DA SILVA FERREIRA", grades: { C01: 4, C02: 4, C03: 4, C04: 5, C05: 5, C06: 5, C07: 3, C08: 4, C09: 4, C10: 4, C11: 5, C12: 5 }, isAttention: true },
  ],
};

// 1ª Série - Ensino Médio
const primeiraSerieEM: ClassRoom = {
  id: "1A-EM",
  name: "1ª Série A",
  level: "EM",
  totalActive: 16,
  subjects: [
    { code: "C01", name: "Arte" },
    { code: "C02", name: "Biologia" },
    { code: "C03", name: "Educação Financeira" },
    { code: "C04", name: "Educação Física" },
    { code: "C05", name: "Filosofia" },
    { code: "C06", name: "Física" },
    { code: "C07", name: "Geografia" },
    { code: "C08", name: "História" },
    { code: "C09", name: "Inglês" },
    { code: "C10", name: "Língua Portuguesa" },
    { code: "C11", name: "Matemática" },
    { code: "C12", name: "Química" },
    { code: "C13", name: "Redação e Leitura" },
  ],
  students: [
    { id: 1, name: "ALEX DE SOUZA FONSECA JUNIOR", grades: { C01: 8, C02: 8, C03: 8, C04: 10, C05: 9, C06: 7, C07: 8, C08: 8, C09: 8, C10: 8, C11: 7, C12: 8, C13: 8 }, isAttention: false },
    { id: 2, name: "CARLOS EDUARDO DE JESUS", grades: { C01: 7, C02: 6, C03: 7, C04: 7, C05: 6, C06: 4, C07: 6, C08: 5, C09: 5, C10: 6, C11: 5, C12: 7, C13: 6 }, isAttention: true },
    { id: 3, name: "ENZO RAMOS MARIANO", grades: { C01: 7, C02: 8, C03: 7, C04: 9, C05: 7, C06: 7, C07: 6, C08: 6, C09: 6, C10: 8, C11: 6, C12: 7, C13: 6 }, isAttention: false },
    { id: 4, name: "EVELYN MARQUES DA SILVA", grades: { C01: 7, C02: 7, C03: 8, C04: 7, C05: 8, C06: 6, C07: 7, C08: 9, C09: 6, C10: 7, C11: 6, C12: 8, C13: 7 }, isAttention: false },
    { id: 5, name: "GUILHERME DE AQUINO VIVIAN", grades: { C01: 9, C02: 9, C03: 9, C04: 8, C05: 9, C06: 8, C07: 9, C08: 9, C09: 9, C10: 9, C11: 8, C12: 9, C13: 9 }, isAttention: false },
    { id: 6, name: "ISABELLE RODRIGUES RIBEIRO", grades: { C01: 7, C02: 6, C03: 8, C04: 8, C05: 6, C06: 6, C07: 7, C08: 6, C09: 6, C10: 6, C11: 5, C12: 7, C13: 7 }, isAttention: false },
    { id: 7, name: "JOÃO LUCAS VICENTE RIBEIRO", grades: { C01: 6, C02: 5, C03: 4, C04: 7, C05: 5, C06: 4, C07: 6, C08: 5, C09: 6, C10: 4, C11: 4, C12: 5, C13: 6 }, isAttention: true },
    { id: 8, name: "LARISSA DANTAS DA SILVA", grades: { C01: 7, C02: 5, C03: 7, C04: 7, C05: 7, C06: 5, C07: 7, C08: 6, C09: 5, C10: 7, C11: 6, C12: 7, C13: 8 }, isAttention: false },
    { id: 9, name: "LUMA GABRIELLY DE SOUZA SANTOS", grades: { C01: 7, C02: 7, C03: 6, C04: 7, C05: 6, C06: 5, C07: 5, C08: 8, C09: 5, C10: 7, C11: 6, C12: 8, C13: 8 }, isAttention: false },
    { id: 10, name: "MARIA ALICE SOARES VOLPE BRITO", grades: { C01: 10, C02: 10, C03: 9, C04: 9, C05: 10, C06: 9, C07: 10, C08: 10, C09: 10, C10: 10, C11: 8, C12: 9, C13: 9 }, isAttention: false },
    { id: 11, name: "MARINA PURISSIMO E SILVA", grades: { C01: 8, C02: 5, C03: 6, C04: 7, C05: 8, C06: 4, C07: 8, C08: 8, C09: 7, C10: 7, C11: 5, C12: 6, C13: 7 }, isAttention: true },
    { id: 12, name: "MELISSA CRISTINA DOS SANTOS DANTAS", grades: { C01: 7, C02: 5, C03: 6, C04: 7, C05: 6, C06: 5, C07: 4, C08: 6, C09: 4, C10: 5, C11: 6, C12: 7, C13: 6 }, isAttention: true },
    { id: 13, name: "MIGUEL ESTEVAM BOY", grades: { C01: 5, C02: 5, C03: 5, C04: 7, C05: 4, C06: 4, C07: 4, C08: 5, C09: 4, C10: 4, C11: 4, C12: 6, C13: 4 }, isAttention: true },
    { id: 14, name: "PEDRO HENRIQUE BERNARDO DA ROCHA", grades: { C01: "TR", C02: "TR", C03: "TR", C04: "TR", C05: "TR", C06: "TR", C07: "TR", C08: "TR", C09: "TR", C10: "TR", C11: "TR", C12: "TR", C13: "TR" }, isAttention: false },
    { id: 15, name: "RITA VITORIA DOS SANTOS", grades: { C01: 5, C02: 3, C03: 5, C04: 5, C05: 4, C06: 3, C07: 3, C08: 3, C09: 2, C10: 4, C11: 4, C12: 3, C13: 5 }, isAttention: true },
    { id: 16, name: "THAYLA YASMIM ALMEIDA NUNES", grades: { C01: "TR", C02: "TR", C03: "TR", C04: "TR", C05: "TR", C06: "TR", C07: "TR", C08: "TR", C09: "TR", C10: "TR", C11: "TR", C12: "TR", C13: "TR" }, isAttention: false },
    { id: 17, name: "TIAGO GABRIEL DE SENA", grades: { C01: 6, C02: 7, C03: 7, C04: 7, C05: 6, C06: 4, C07: 6, C08: 5, C09: 5, C10: 5, C11: 5, C12: 5, C13: 5 }, isAttention: true },
    { id: 18, name: "YASMIM BIANCA ALVES DE OLIVEIRA", grades: { C01: 7, C02: 5, C03: 7, C04: 8, C05: 6, C06: 6, C07: 5, C08: 6, C09: 5, C10: 7, C11: 7, C12: 3, C13: 6 }, isAttention: true },
  ],
};

// 2ª Série - Ensino Médio
const segundaSerieEM: ClassRoom = {
  id: "2A-EM",
  name: "2ª Série A",
  level: "EM",
  totalActive: 10,
  subjects: [
    { code: "C01", name: "Arte e Mídias Digitais" },
    { code: "C02", name: "Biologia" },
    { code: "C03", name: "Educação Financeira" },
    { code: "C04", name: "Educação Física" },
    { code: "C05", name: "Liderança e Oratória" },
    { code: "C06", name: "Física" },
    { code: "C07", name: "Geografia" },
    { code: "C08", name: "História" },
    { code: "C09", name: "Língua Inglesa" },
    { code: "C10", name: "Língua Portuguesa" },
    { code: "C11", name: "Matemática" },
    { code: "C12", name: "Química" },
    { code: "C13", name: "Redação e Leitura" },
    { code: "C14", name: "Sociologia" },
  ],
  students: [
    { id: 1, name: "ANA LUIZA SANTOS BAISAR", grades: { C01: 7, C02: 8, C03: 6, C04: 10, C05: 8, C06: 6, C07: 6, C08: 6, C09: 7, C10: 6, C11: 6, C12: 7, C13: 8, C14: 8 }, isAttention: false },
    { id: 2, name: "BRYAN HENRIQUE DE ARAUJO", grades: { C01: 8, C02: 9, C03: 6, C04: 10, C05: 7, C06: 6, C07: 7, C08: 5, C09: 8, C10: 7, C11: 4, C12: 7, C13: 7, C14: 7 }, isAttention: true },
    { id: 3, name: "DANIEL GONÇALVES DE LIMA", grades: { C01: 7, C02: 8, C03: 7, C04: 8, C05: 6, C06: 5, C07: 6, C08: 7, C09: 6, C10: 7, C11: 4, C12: 7, C13: 7, C14: 6 }, isAttention: true },
    { id: 4, name: "JOÃO PEDRO GOIS REGO", grades: { C01: 7, C02: 6, C03: 5, C04: 9, C05: 6, C06: 5, C07: 6, C08: 5, C09: 3, C10: 6, C11: 4, C12: 6, C13: 6, C14: 6 }, isAttention: true },
    { id: 5, name: "MARIA ALICE ALVES SILVA", grades: { C01: 8, C02: 10, C03: 7, C04: 7, C05: 8, C06: 7, C07: 9, C08: 8, C09: 8, C10: 7, C11: 4, C12: 8, C13: 8, C14: 8 }, isAttention: true },
    { id: 6, name: "MARIA HELOISA BRITO SILVA", grades: { C01: 5, C02: 6, C03: 5, C04: 7, C05: 6, C06: 5, C07: 5, C08: 5, C09: 5, C10: 5, C11: 5, C12: 4, C13: 6, C14: 5 }, isAttention: false },
    { id: 7, name: "MURILLO ESTEVAM BOY", grades: { C01: 6, C02: 7, C03: 7, C04: 10, C05: 6, C06: 6, C07: 6, C08: 6, C09: 7, C10: 7, C11: 5, C12: 6, C13: 7, C14: 7 }, isAttention: false },
    { id: 8, name: "SOPHIA GOIS FURINI", grades: { C01: 6, C02: 8, C03: 6, C04: 9, C05: 7, C06: 6, C07: 6, C08: 6, C09: 6, C10: 7, C11: 4, C12: 6, C13: 7, C14: 6 }, isAttention: true },
    { id: 9, name: "THALITA SANTOS GOIS", grades: { C01: 6, C02: 7, C03: 5, C04: 8, C05: 7, C06: 4, C07: 6, C08: 5, C09: 6, C10: 4, C11: 4, C12: 4, C13: 6, C14: 5 }, isAttention: true },
    { id: 10, name: "WILHERME DANTAS DA SILVA", grades: { C01: 8, C02: 10, C03: 7, C04: 9, C05: 8, C06: 5, C07: 5, C08: 5, C09: 5, C10: 6, C11: 4, C12: 7, C13: 7, C14: 7 }, isAttention: true },
    { id: 11, name: "MICHAEL EDUARDO DA SILVA ROSA", grades: { C01: "TR", C02: "TR", C03: "TR", C04: "TR", C05: "TR", C06: "TR", C07: "TR", C08: "TR", C09: "TR", C10: "TR", C11: "TR", C12: "TR", C13: "TR", C14: "TR" }, isAttention: false },
  ],
};

// 3ª Série - Ensino Médio
const terceiraSerieEM: ClassRoom = {
  id: "3A-EM",
  name: "3ª Série A",
  level: "EM",
  totalActive: 25,
  subjects: [
    { code: "C01", name: "Atualidades" },
    { code: "C02", name: "Projeto de Vida" },
    { code: "C03", name: "OE - Língua Portuguesa" },
    { code: "C04", name: "Educação Física" },
    { code: "C05", name: "OE - Matemática" },
    { code: "C06", name: "Física" },
    { code: "C07", name: "Aprof. de Geografia" },
    { code: "C08", name: "História" },
    { code: "C09", name: "Língua Inglesa" },
    { code: "C10", name: "Língua Portuguesa" },
    { code: "C11", name: "Matemática" },
    { code: "C12", name: "Aprof. de Filosofia" },
    { code: "C13", name: "Redação e Leitura" },
    { code: "C14", name: "Aprof. de Sociologia" },
  ],
  students: [
    { id: 1, name: "ALEXANDRE SANTOS ARAUJO", grades: { C01: 5, C02: 7, C03: 6, C04: 7, C05: 7, C06: 5, C07: 7, C08: 6, C09: 5, C10: 7, C11: 5, C12: 8, C13: 5, C14: 7 }, isAttention: false },
    { id: 2, name: "ANA LUIZA ARAUJO ROCHA", grades: { C01: 6, C02: 7, C03: 6, C04: 10, C05: 5, C06: 4, C07: 7, C08: 6, C09: 6, C10: 5, C11: 4, C12: 6, C13: 4, C14: 5 }, isAttention: true },
    { id: 3, name: "BIANCA CRISTINA DOS SANTOS DANTAS", grades: { C01: 8, C02: 5, C03: 5, C04: 7, C05: 5, C06: 5, C07: 8, C08: 5, C09: 6, C10: 5, C11: 5, C12: 8, C13: 6, C14: 8 }, isAttention: false },
    { id: 4, name: "CAUE ALMEIDA SOUZA", grades: { C01: 7, C02: 6, C03: 4, C04: 9, C05: 7, C06: 5, C07: 8, C08: 6, C09: 5, C10: 5, C11: 4, C12: 8, C13: 4, C14: 8 }, isAttention: true },
    { id: 5, name: "DOMINIQUE CRISTINY MANZARIN", grades: { C01: 7, C02: 6, C03: 7, C04: 8, C05: 6, C06: 7, C07: 7, C08: 7, C09: 7, C10: 6, C11: 5, C12: 8, C13: 7, C14: 7 }, isAttention: false },
    { id: 6, name: "GABRIEL JUNIOR SENA", grades: { C01: 8, C02: 8, C03: 8, C04: 8, C05: 6, C06: 5, C07: 8, C08: 8, C09: 6, C10: 7, C11: 7, C12: 7, C13: 7, C14: 8 }, isAttention: false },
    { id: 7, name: "GLENDA SAMANTA DE OLIVEIRA BORDON", grades: { C01: 6, C02: 5, C03: 5, C04: 7, C05: 4, C06: 5, C07: 5, C08: 4, C09: 4, C10: 5, C11: 4, C12: 6, C13: 5, C14: 5 }, isAttention: true },
    { id: 8, name: "GUILHERME BRESSA REIS", grades: { C01: 7, C02: 8, C03: 7, C04: 10, C05: 6, C06: 6, C07: 7, C08: 7, C09: 5, C10: 6, C11: 5, C12: 8, C13: 6, C14: 8 }, isAttention: false },
    { id: 9, name: "GUSTAVO BRITO SILVA", grades: { C01: 8, C02: 8, C03: 7, C04: 10, C05: 5, C06: 7, C07: 7, C08: 7, C09: 5, C10: 7, C11: 6, C12: 7, C13: 6, C14: 8 }, isAttention: false },
    { id: 10, name: "HUGO CANCIAN", grades: { C01: 7, C02: 8, C03: 8, C04: 8, C05: 6, C06: 6, C07: 8, C08: 8, C09: 7, C10: 7, C11: 5, C12: 8, C13: 6, C14: 8 }, isAttention: false },
    { id: 11, name: "ISADORA AQUINO RODRIGUES ALVES", grades: { C01: 8, C02: 6, C03: 6, C04: 8, C05: 6, C06: 6, C07: 9, C08: 8, C09: 6, C10: 6, C11: 5, C12: 8, C13: 6, C14: 9 }, isAttention: false },
    { id: 12, name: "JOÃO LUCAS SANTOS SILVA", grades: { C01: 8, C02: 8, C03: 7, C04: 9, C05: 5, C06: 8, C07: 8, C08: 7, C09: 6, C10: 8, C11: 6, C12: 7, C13: 7, C14: 6 }, isAttention: false },
    { id: 13, name: "JOÃO VICTOR AUGUSTO VIEIRA", grades: { C01: 8, C02: 10, C03: 7, C04: 9, C05: 5, C06: 8, C07: 9, C08: 8, C09: 8, C10: 7, C11: 8, C12: 8, C13: 6, C14: 8 }, isAttention: false },
    { id: 14, name: "KAUÃ REGO DA ROCHA", grades: { C01: 7, C02: 6, C03: 4, C04: 9, C05: 4, C06: 4, C07: 7, C08: 4, C09: 4, C10: 4, C11: 3, C12: 7, C13: 4, C14: 6 }, isAttention: true },
    { id: 15, name: "KAYKE RAFAEL DEFACIO DA SILVA", grades: { C01: 8, C02: 7, C03: 6, C04: 10, C05: 7, C06: 6, C07: 8, C08: 7, C09: 6, C10: 6, C11: 6, C12: 7, C13: 5, C14: 8 }, isAttention: false },
    { id: 16, name: "LARA CANCIAN DE BRITO", grades: { C01: 6, C02: 6, C03: 5, C04: 8, C05: 6, C06: 4, C07: 7, C08: 6, C09: 6, C10: 5, C11: 5, C12: 7, C13: 6, C14: 7 }, isAttention: true },
    { id: 17, name: "LARA SILVA CORDEIRO", grades: { C01: 4, C02: 5, C03: 4, C04: 8, C05: 5, C06: 4, C07: 6, C08: 4, C09: 3, C10: 5, C11: 4, C12: 5, C13: 6, C14: 4 }, isAttention: true },
    { id: 18, name: "LIVIA BORGES FERREIRA", grades: { C01: 7, C02: 5, C03: 9, C04: 6, C05: 6, C06: 5, C07: 8, C08: 8, C09: 8, C10: 8, C11: 6, C12: 8, C13: 6, C14: 8 }, isAttention: false },
    { id: 19, name: "MARIA JULIA SOARES BRITO", grades: { C01: 8, C02: 7, C03: 7, C04: 8, C05: 6, C06: 6, C07: 8, C08: 8, C09: 7, C10: 8, C11: 6, C12: 8, C13: 7, C14: 8 }, isAttention: false },
    { id: 20, name: "MARIA RITA RODRIGUES DE PAULO", grades: { C01: 7, C02: 6, C03: 5, C04: 7, C05: 6, C06: 4, C07: 7, C08: 5, C09: 5, C10: 4, C11: 4, C12: 7, C13: 6, C14: 6 }, isAttention: true },
    { id: 21, name: "MELISSA PASCHOALOTTO DOS SANTOS", grades: { C01: 4, C02: 4, C03: 5, C04: 8, C05: 5, C06: 4, C07: 5, C08: 4, C09: 4, C10: 4, C11: 4, C12: 4, C13: 6, C14: 5 }, isAttention: true },
    { id: 22, name: "PIETRA CRISTINA SANTOS ALMEIDA", grades: { C01: 7, C02: 5, C03: 6, C04: 7, C05: 5, C06: 4, C07: 7, C08: 5, C09: 4, C10: 5, C11: 4, C12: 7, C13: 5, C14: 7 }, isAttention: true },
    { id: 23, name: "RAISSA REMONDINI DOS SANTOS", grades: { C01: 8, C02: 7, C03: 7, C04: 7, C05: 6, C06: 6, C07: 8, C08: 7, C09: 6, C10: 6, C11: 6, C12: 8, C13: 7, C14: 8 }, isAttention: false },
    { id: 24, name: "RUAN SILVA FONSECA", grades: { C01: 9, C02: 9, C03: 8, C04: 9, C05: 8, C06: 9, C07: 9, C08: 9, C09: 9, C10: 8, C11: 9, C12: 9, C13: 8, C14: 9 }, isAttention: false },
    { id: 25, name: "THAMIRES DIAS LEAL", grades: { C01: 7, C02: 6, C03: 7, C04: 8, C05: 6, C06: 6, C07: 6, C08: 7, C09: 5, C10: 5, C11: 5, C12: 7, C13: 4, C14: 5 }, isAttention: true },
  ],
};

export const ALL_CLASSROOMS: ClassRoom[] = [
  sextoAno,
  setimoAno,
  oitavoAno,
  nonoAno,
  primeiraSerieEM,
  segundaSerieEM,
  terceiraSerieEM,
];

export const SCHOOL_INFO = {
  name: "EE Carlos Bernardes Staut",
  address: "Rua Antônio Bueno da Costa, 65",
  city: "Ribeirão dos Índios",
  state: "SP",
  cep: "19380-029",
  bimester: "1º Bimestre",
  year: 2026,
  totalStudents: ALL_CLASSROOMS.reduce((acc, c) => acc + c.totalActive, 0),
};

// Funções de Análise
export function getClassroomAverage(classroom: ClassRoom): number {
  let totalSum = 0;
  let totalCount = 0;

  classroom.students.forEach((student) => {
    Object.values(student.grades).forEach((grade) => {
      if (typeof grade === "number") {
        totalSum += grade;
        totalCount++;
      }
    });
  });

  return totalCount > 0 ? totalSum / totalCount : 0;
}

export function getStudentAverage(student: Student): number {
  const grades = Object.values(student.grades).filter(
    (g): g is number => typeof g === "number"
  );
  if (grades.length === 0) return 0;
  return grades.reduce((a, b) => a + b, 0) / grades.length;
}

export function getSubjectAverageAcrossSchool(subjectName: string): number {
  let totalSum = 0;
  let totalCount = 0;

  ALL_CLASSROOMS.forEach((classroom) => {
    const subject = classroom.subjects.find((s) =>
      s.name.toLowerCase().includes(subjectName.toLowerCase())
    );
    if (subject) {
      classroom.students.forEach((student) => {
        const grade = student.grades[subject.code];
        if (typeof grade === "number") {
          totalSum += grade;
          totalCount++;
        }
      });
    }
  });

  return totalCount > 0 ? totalSum / totalCount : 0;
}

export function getPedagogicalDistribution(classroom: ClassRoom): {
  critical: number;
  basic: number;
  adequate: number;
  advanced: number;
} {
  const distribution = { critical: 0, basic: 0, adequate: 0, advanced: 0 };

  classroom.students.forEach((student) => {
    const avg = getStudentAverage(student);
    if (avg === 0) return; // Transferido
    const level = getPedagogicalLevel(Math.round(avg));
    distribution[level]++;
  });

  return distribution;
}

export function getSchoolPedagogicalDistribution(): {
  critical: number;
  basic: number;
  adequate: number;
  advanced: number;
} {
  const distribution = { critical: 0, basic: 0, adequate: 0, advanced: 0 };

  ALL_CLASSROOMS.forEach((classroom) => {
    classroom.students.forEach((student) => {
      const avg = getStudentAverage(student);
      if (avg === 0) return;
      const level = getPedagogicalLevel(Math.round(avg));
      distribution[level]++;
    });
  });

  return distribution;
}

export function getCriticalSubjects(): { name: string; percentCritical: number }[] {
  const subjectStats: Record<string, { critical: number; total: number }> = {};

  ALL_CLASSROOMS.forEach((classroom) => {
    classroom.subjects.forEach((subject) => {
      if (!subjectStats[subject.name]) {
        subjectStats[subject.name] = { critical: 0, total: 0 };
      }

      classroom.students.forEach((student) => {
        const grade = student.grades[subject.code];
        if (typeof grade === "number") {
          subjectStats[subject.name].total++;
          if (grade <= 4) {
            subjectStats[subject.name].critical++;
          }
        }
      });
    });
  });

  return Object.entries(subjectStats)
    .map(([name, stats]) => ({
      name,
      percentCritical: stats.total > 0 ? (stats.critical / stats.total) * 100 : 0,
    }))
    .filter((s) => s.percentCritical > 0)
    .sort((a, b) => b.percentCritical - a.percentCritical);
}

export function getCriticalStudents(): { student: Student; classroom: ClassRoom; average: number; criticalSubjects: number }[] {
  const criticalStudents: { student: Student; classroom: ClassRoom; average: number; criticalSubjects: number }[] = [];

  ALL_CLASSROOMS.forEach((classroom) => {
    classroom.students.forEach((student) => {
      const avg = getStudentAverage(student);
      if (avg > 0 && avg < 5) {
        const criticalSubjects = Object.values(student.grades).filter(
          (g) => typeof g === "number" && g <= 4
        ).length;
        criticalStudents.push({ student, classroom, average: avg, criticalSubjects });
      }
    });
  });

  return criticalStudents.sort((a, b) => a.average - b.average);
}

export function getClassroomRanking(): { classroom: ClassRoom; average: number }[] {
  return ALL_CLASSROOMS.map((classroom) => ({
    classroom,
    average: getClassroomAverage(classroom),
  })).sort((a, b) => b.average - a.average);
}
