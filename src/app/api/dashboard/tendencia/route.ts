import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import { cache } from "../../../../lib/cache";
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
  try {
  const { searchParams } = new URL(request.url);
  const turmaId = searchParams.get("turma") ?? undefined;

  const supabase = await createClient();

  const alunosKey = turmaId ? `alunos:${ESCOLA_ID}:turma:${turmaId}` : `alunos:${ESCOLA_ID}`;
  const turmasKey = turmaId ? `turmas:${ESCOLA_ID}:${turmaId}` : `turmas:${ESCOLA_ID}`;
  const notasKey = turmaId ? `notas:${ESCOLA_ID}:turma:${turmaId}` : `notas:${ESCOLA_ID}`;

  const { data: escola } = await supabase
    .from("escolas")
    .select("ano_letivo")
    .eq("id", ESCOLA_ID)
    .single();

  const turmaData = turmaId
    ? await cache.getOrSet(`turma:${turmaId}`, async () => {
        const { data } = await supabase
          .from("turmas")
          .select("id, nome")
          .eq("id", turmaId)
          .single();
        return data;
      })
    : null;

  const [alunos, disciplinas] = await Promise.all([
    cache.getOrSet(alunosKey, async () => {
      const { data } = turmaId
        ? await supabase.from("alunos").select("*").eq("turma_id", turmaId).eq("ativo", true)
        : await supabase.from("alunos").select("*").eq("escola_id", ESCOLA_ID).eq("ativo", true);
      return (data ?? []) as Aluno[];
    }),
    cache.getOrSet(`disciplinas:${ESCOLA_ID}`, async () => {
      const { data } = await supabase
        .from("disciplinas")
        .select("*")
        .eq("escola_id", ESCOLA_ID);
      return (data ?? []) as Disciplina[];
    }),
  ]);

  const turmas = await cache.getOrSet(turmasKey, async () => {
    const q = turmaId
      ? supabase.from("turmas").select("*").eq("id", turmaId)
      : supabase.from("turmas").select("*").eq("escola_id", ESCOLA_ID);
    const { data } = await q;
    return (data ?? []) as Turma[];
  });

  const anoLetivo = escola?.ano_letivo ?? new Date().getFullYear();
  const todasNotas = await cache.getOrSet(notasKey, () =>
    buscarTodasNotas(supabase, ESCOLA_ID, turmaId)
  );

  const labels: Record<number, string> = {
    1: "1º Bim",
    2: "2º Bim",
    3: "3º Bim",
    4: "4º Bim",
  };

  const pontos = [1, 2, 3, 4].map((bimestre) => {
    const dashboard = buildSchoolDashboard({
      alunos,
      notas: todasNotas,
      turmas,
      disciplinas,
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
  } catch (err) {
    console.error("[tendencia]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
