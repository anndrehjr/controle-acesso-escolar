export type ComponenteCaderno = { nome: string; peso: number | null; notaMaxima: number };

export function calcularNotaCaderno(
  componentes: ComponenteCaderno[],
  valores: Array<number | null>,
): { nota: number | null; ponderada: boolean } {
  const preenchidos = componentes
    .map((componente, indice) => ({ componente, valor: valores[indice] }))
    .filter((item): item is { componente: ComponenteCaderno; valor: number } =>
      typeof item.valor === "number" && Number.isFinite(item.valor));
  if (!preenchidos.length) return { nota: null, ponderada: false };

  const todosPesosDefinidos = componentes.length > 0
    && componentes.every((item) => typeof item.peso === "number" && item.peso > 0);
  if (todosPesosDefinidos) {
    const usados = preenchidos.filter((item) => (item.componente.peso ?? 0) > 0);
    const somaPesos = usados.reduce((total, item) => total + (item.componente.peso ?? 0), 0);
    if (!somaPesos) return { nota: null, ponderada: true };
    const nota = usados.reduce((total, item) =>
      total + (item.valor / item.componente.notaMaxima * 10) * (item.componente.peso ?? 0), 0) / somaPesos;
    return { nota: Math.round(nota * 100) / 100, ponderada: true };
  }

  const nota = preenchidos.reduce((total, item) =>
    total + item.valor / item.componente.notaMaxima * 10, 0) / preenchidos.length;
  return { nota: Math.round(nota * 100) / 100, ponderada: false };
}

export function componentesPadrao(nomeDisciplina: string): ComponenteCaderno[] {
  const nome = nomeDisciplina.toLocaleLowerCase("pt-BR");
  const colunas = nome.includes("ingl")
    ? ["Avaliação 1", "Avaliação 2", "Tarefa", "Speak", "Prova Paulista", "Engajamento"]
    : nameEhOrientacao(nome)
      ? ["Avaliação 1", "Avaliação 2", "Tarefa", "Portfólio", "Engajamento"]
      : ["Avaliação 1", "Avaliação 2", "Tarefa", "Atividades", "Engajamento"];
  return colunas.map((item) => ({ nome: item, peso: null, notaMaxima: 10 }));
}

function nameEhOrientacao(nome: string) {
  return nome.startsWith("oe ") || nome.startsWith("oe -") || nome.includes("orientação de estudo");
}
