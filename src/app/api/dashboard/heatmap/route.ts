import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { buildHeatmapPedagogico } from "../../../../lib/analytics/buildHeatmapPedagogico";
import { cache } from "../../../../lib/cache";

import type {
  Aluno,
  Disciplina,
  MatrizDisciplina,
  Nota,
  Turma,
} from "../../../../lib/analytics/types";

const ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

async function buscarTodasNotas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  escolaId: string,
  bimestre: number
): Promise<Nota[]> {
  const tamanhoPagina = 1000;
  let pagina = 0;
  let todasNotas: Nota[] = [];

  while (true) {
    const inicio = pagina * tamanhoPagina;
    const fim = inicio + tamanhoPagina - 1;

    const { data, error } = await supabase
      .from("notas")
      .select("*")
      .eq("escola_id", escolaId)
      .eq("bimestre", bimestre)
      .range(inicio, fim);

    if (error || !data || data.length === 0) break;

    todasNotas = [...todasNotas, ...(data as Nota[])];
    if (data.length < tamanhoPagina) break;
    pagina++;
  }

  return todasNotas;
}

export async function GET(request: Request) {
  try {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const bimestre = Number(searchParams.get("bimestre") ?? "1");
  const turmaId = searchParams.get("turma");

  const turmasKey = turmaId ? `turmas:${ESCOLA_ID}:${turmaId}` : `turmas:${ESCOLA_ID}`;
  const alunosKey = turmaId ? `alunos:${ESCOLA_ID}:turma:${turmaId}` : `alunos:${ESCOLA_ID}`;

  const [turmas, alunos, disciplinas, matriz] = await Promise.all([
    cache.getOrSet(turmasKey, async () => {
      const q = supabase
        .from("turmas")
        .select("*")
        .eq("escola_id", ESCOLA_ID)
        .order("ano_serie", { ascending: true });
      const { data } = await (turmaId ? q.eq("id", turmaId) : q);
      return (data ?? []) as Turma[];
    }),
    cache.getOrSet(alunosKey, async () => {
      const q = supabase
        .from("alunos")
        .select("*")
        .eq("escola_id", ESCOLA_ID)
        .eq("ativo", true);
      const { data } = await (turmaId ? q.eq("turma_id", turmaId) : q);
      return (data ?? []) as Aluno[];
    }),
    cache.getOrSet(`disciplinas:${ESCOLA_ID}`, async () => {
      const { data } = await supabase
        .from("disciplinas")
        .select("*")
        .eq("escola_id", ESCOLA_ID);
      return (data ?? []) as Disciplina[];
    }),
    cache.getOrSet(`matriz:${ESCOLA_ID}`, async () => {
      const { data } = await supabase
        .from("matriz_disciplinas")
        .select("*")
        .eq("escola_id", ESCOLA_ID);
      return (data ?? []) as MatrizDisciplina[];
    }),
  ]);

  const notas = await cache.getOrSet(
    `notas:${ESCOLA_ID}:bim:${bimestre}`,
    () => buscarTodasNotas(supabase, ESCOLA_ID, bimestre)
  );

  const heatmap = buildHeatmapPedagogico({
    alunos,
    notas,
    turmas,
    disciplinas,
    matriz,
  });

  return NextResponse.json({ data: heatmap });
  } catch (err) {
    console.error("[heatmap]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
