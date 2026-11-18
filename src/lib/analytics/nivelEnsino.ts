import type { Turma } from "./types";

/**
 * Classifica uma turma como Fundamental ou Médio. Usa grupo_pedagogico
 * quando disponível, com fallback pelo nome da turma — mesmo critério já
 * usado em buildRiscoAcademico/buildSchoolDashboard, centralizado aqui pra
 * quem precisa separar Fundamental de Médio de verdade (nunca misturar
 * disciplinas dos dois níveis, mesmo quando têm o mesmo nome).
 */
export function nivelDaTurma(turma: Pick<Turma, "grupo_pedagogico" | "nome">): "fundamental" | "medio" | null {
  const grp = String(turma.grupo_pedagogico ?? "").trim().toUpperCase();
  const nome = turma.nome.toLowerCase();

  if (grp.startsWith("EF") || grp === "FUNDAMENTAL") return "fundamental";
  if (grp.startsWith("EM") || grp === "MEDIO" || grp === "MÉDIO") return "medio";

  if (nome.includes("ano") || nome.includes("fundamental")) return "fundamental";
  if (
    nome.includes("série") ||
    nome.includes("serie") ||
    nome.includes("médio") ||
    nome.includes("medio")
  ) {
    return "medio";
  }

  return null;
}

/** Separa uma lista de turmas em Fundamental e Médio. */
export function separarTurmasPorNivel<T extends Pick<Turma, "id" | "grupo_pedagogico" | "nome">>(
  turmas: T[]
): { fundamental: T[]; medio: T[] } {
  const fundamental: T[] = [];
  const medio: T[] = [];
  for (const turma of turmas) {
    const nivel = nivelDaTurma(turma);
    if (nivel === "fundamental") fundamental.push(turma);
    else if (nivel === "medio") medio.push(turma);
  }
  return { fundamental, medio };
}
