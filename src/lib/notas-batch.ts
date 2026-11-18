export type NotaEntrada = {
  alunoId?: unknown;
  disciplinaId?: unknown;
  turmaId?: unknown;
  bimestre?: unknown;
  anoLetivo?: unknown;
  nota?: unknown;
};

export type NotaNormalizada = {
  alunoId: string;
  disciplinaId: string;
  turmaId: string;
  bimestre: number;
  anoLetivo: number;
  nota: number;
};

export type ValidacaoLote =
  | { ok: true; itens: NotaNormalizada[] }
  | { ok: false; erro: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validarLoteNotas(entradas: unknown, limite = 200): ValidacaoLote {
  if (!Array.isArray(entradas) || entradas.length === 0) {
    return { ok: false, erro: "Envie pelo menos uma nota" };
  }
  if (entradas.length > limite) {
    return { ok: false, erro: `Máximo de ${limite} notas por requisição` };
  }

  const itens: NotaNormalizada[] = [];
  for (let index = 0; index < entradas.length; index++) {
    const raw = entradas[index];
    if (!raw || typeof raw !== "object") {
      return { ok: false, erro: `Nota ${index + 1}: formato inválido` };
    }
    const item = raw as NotaEntrada;
    if (typeof item.alunoId !== "string" || !UUID.test(item.alunoId)) {
      return { ok: false, erro: `Nota ${index + 1}: alunoId inválido` };
    }
    if (typeof item.disciplinaId !== "string" || !UUID.test(item.disciplinaId)) {
      return { ok: false, erro: `Nota ${index + 1}: disciplinaId inválido` };
    }
    if (typeof item.turmaId !== "string" || !UUID.test(item.turmaId)) {
      return { ok: false, erro: `Nota ${index + 1}: turmaId inválido` };
    }
    if (!Number.isInteger(item.bimestre) || Number(item.bimestre) < 1 || Number(item.bimestre) > 4) {
      return { ok: false, erro: `Nota ${index + 1}: bimestre precisa ser de 1 a 4` };
    }
    if (!Number.isInteger(item.anoLetivo) || Number(item.anoLetivo) < 2000 || Number(item.anoLetivo) > 2100) {
      return { ok: false, erro: `Nota ${index + 1}: anoLetivo inválido` };
    }
    if (typeof item.nota !== "number" || !Number.isFinite(item.nota) || item.nota < 0 || item.nota > 10) {
      return { ok: false, erro: `Nota ${index + 1}: valor precisa estar entre 0 e 10` };
    }
    itens.push({
      alunoId: item.alunoId,
      disciplinaId: item.disciplinaId,
      turmaId: item.turmaId,
      bimestre: Number(item.bimestre),
      anoLetivo: Number(item.anoLetivo),
      nota: item.nota,
    });
  }

  const chaves = itens.map((item) => `${item.alunoId}:${item.disciplinaId}:${item.bimestre}:${item.anoLetivo}`);
  if (new Set(chaves).size !== chaves.length) {
    return { ok: false, erro: "O lote contém a mesma nota mais de uma vez" };
  }

  return { ok: true, itens };
}
