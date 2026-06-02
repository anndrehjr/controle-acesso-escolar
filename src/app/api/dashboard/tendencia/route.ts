import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import type { Aluno, Disciplina, Nota, Turma } from "../../../../lib/analytics/types";

const ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

async function buscarTodasNotas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  escolaId: string,
  turmaId?: string
): Promise<Nota[]> {
  const tamanhoPagina = 1000;
  let pagina = 0;
  let todasNotas: Nota[] = [];

  while (true) {
    const inicio = pagina * tamanhoPagina;
    const fim = inicio + tamanhoPagina - 1;

    let query = supabase
      .from("notas")
      .select("*")
      .eq("escola_id", escolaId)
      .range(inicio, fim);

    if (turmaId) query = query.eq("turma_id", turmaId);

    const { data, error } = await query;
    if (error || !data || data.length === 0) break;
    todasNotas = [...todasNotas, ...(data as Nota[])];
    if (data.length < tamanhoPagina) break;
    pagina++;
  }

  return todasNotas;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const turmaId = searchParams.get("turma") ?? undefined;

  const supabase = await createClient();

  const [
    { data: escola },
    { data: turmaData },
    { data: alunos = [] },
    { data: disciplinas = [] },
  ] = await Promise.all([
    supabase.from("escolas").select("ano_letivo").eq("id", ESCOLA_ID).single(),
    turmaId
      ? supabase.from("turmas").select("id, nome").eq("id", turmaId).single()
      : Promise.resolve({ data: null }),
    turmaId
      ? supabase.from("alunos").select("*").eq("turma_id", turmaId).eq("ativo", true)
      : supabase.from("alunos").select("*").eq("escola_id", ESCOLA_ID).eq("ativo", true),
    supabase.from("disciplinas").select("*").eq("escola_id", ESCOLA_ID),
  ]);

  const anoLetivo = escola?.ano_letivo ?? new Date().getFullYear();

  const turmasQuery = turmaId
    ? supabase.from("turmas").select("*").eq("id", turmaId)
    : supabase.from("turmas").select("*").eq("escola_id", ESCOLA_ID);

  const { data: turmas = [] } = await turmasQuery;

  const todasNotas = await buscarTodasNotas(supabase, ESCOLA_ID, turmaId);

  const labels: Record<number, string> = {
    1: "1º Bim",
    2: "2º Bim",
    3: "3º Bim",
    4: "4º Bim",
  };

  const pontos = [1, 2, 3, 4].map((bimestre) => {
    const dashboard = buildSchoolDashboard({
      alunos: alunos as Aluno[],
      notas: todasNotas,
      turmas: turmas as Turma[],
      disciplinas: disciplinas as Disciplina[],
      bimestre,
      anoLetivo,
    });

    const temDados = dashboard.notasValidas.length > 0;

    return {
      bimestre,
      label: labels[bimestre],
      media: temDados ? Number(dashboard.mediaGeral.toFixed(2)) : null,
      totalNotas: dashboard.notasValidas.length,
      alunosCriticos: dashboard.alunosCriticos.length,
      percentualAdequado: temDados
        ? Number(dashboard.percentualAdequado.toFixed(1))
        : null,
      temDados,
    };
  });

  return NextResponse.json({
    turma: turmaData ?? null,
    pontos,
  });
}
