import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { buildHeatmapPedagogico } from "../../../../lib/analytics/buildHeatmapPedagogico";

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
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const bimestre = Number(searchParams.get("bimestre") ?? "1");
  const turmaId = searchParams.get("turma");

  const turmasQuery = supabase
    .from("turmas")
    .select("*")
    .eq("escola_id", ESCOLA_ID)
    .order("ano_serie", { ascending: true });

  const alunosQuery = supabase
    .from("alunos")
    .select("*")
    .eq("escola_id", ESCOLA_ID)
    .eq("ativo", true);

  const [
    { data: turmas = [] },
    { data: alunos = [] },
    { data: disciplinas = [] },
    { data: matriz = [] },
  ] = await Promise.all([
    turmaId ? turmasQuery.eq("id", turmaId) : turmasQuery,
    turmaId ? alunosQuery.eq("turma_id", turmaId) : alunosQuery,
    supabase.from("disciplinas").select("*").eq("escola_id", ESCOLA_ID),
    supabase.from("matriz_disciplinas").select("*").eq("escola_id", ESCOLA_ID),
  ]);

  const notas = await buscarTodasNotas(supabase, ESCOLA_ID, bimestre);

  const heatmap = buildHeatmapPedagogico({
    alunos: alunos as Aluno[],
    notas: notas as Nota[],
    turmas: turmas as Turma[],
    disciplinas: disciplinas as Disciplina[],
    matriz: matriz as MatrizDisciplina[],
  });

  return NextResponse.json({ data: heatmap });
}
