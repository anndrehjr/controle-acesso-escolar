import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import { cache } from "../../../../lib/cache";
import type { Aluno, Disciplina, Nota, Turma } from "../../../../lib/analytics/types";

const ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

async function buscarNotasBimestre(
  supabase: Awaited<ReturnType<typeof createClient>>,
  escolaId: string,
  bimestre: number,
  turmaId: string
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
      .eq("turma_id", turmaId)
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
  const { searchParams } = new URL(request.url);
  const turmaId = searchParams.get("turma");

  if (!turmaId) {
    return NextResponse.json({ error: "turma obrigatória" }, { status: 400 });
  }

  const supabase = await createClient();

  const [turmaData, alunos, disciplinas] = await Promise.all([
    cache.getOrSet(`turma:${turmaId}`, async () => {
      const { data } = await supabase.from("turmas").select("*").eq("id", turmaId).single();
      return data as Turma | null;
    }),
    cache.getOrSet(`alunos:${ESCOLA_ID}:turma:${turmaId}`, async () => {
      const { data } = await supabase
        .from("alunos")
        .select("*")
        .eq("turma_id", turmaId)
        .eq("ativo", true);
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

  if (!turmaData) {
    return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  }

  const { data: escola } = await supabase
    .from("escolas")
    .select("ano_letivo")
    .eq("id", ESCOLA_ID)
    .single();

  const anoLetivo = escola?.ano_letivo ?? new Date().getFullYear();

  const [notasB1, notasB2] = await Promise.all([
    cache.getOrSet(`notas:${ESCOLA_ID}:bim:1:turma:${turmaId}`, () =>
      buscarNotasBimestre(supabase, ESCOLA_ID, 1, turmaId)
    ),
    cache.getOrSet(`notas:${ESCOLA_ID}:bim:2:turma:${turmaId}`, () =>
      buscarNotasBimestre(supabase, ESCOLA_ID, 2, turmaId)
    ),
  ]);

  function buildSnapshot(notas: Nota[], bimestre: number) {
    const dashboard = buildSchoolDashboard({
      alunos,
      notas,
      turmas: [turmaData as Turma],
      disciplinas,
      bimestre,
      anoLetivo,
    });

    const mediasPorAluno = dashboard.mediasPorAluno
      .filter((item) => item.media !== null)
      .map((item) => ({
        alunoId: item.aluno.id,
        nome: item.aluno.nome,
        numeroChamada: item.aluno.numero_chamada,
        media: item.media as number,
      }));

    return {
      bimestre,
      temDados: notas.length > 0,
      mediaGeral: dashboard.mediaGeral,
      totalAlunos: dashboard.alunosAtivos.length,
      alunosCriticos: dashboard.alunosCriticos.length,
      percentualAdequado: dashboard.percentualAdequado,
      disciplinas: dashboard.disciplinasCriticasGeral.map((d) => ({
        id: d.disciplina.id,
        nome: d.disciplina.nome,
        percentualCritico: d.percentual,
        totalNotas: d.totalNotas ?? 0,
      })),
      mediasPorAluno,
    };
  }

  return NextResponse.json({
    turma: { id: turmaData.id, nome: turmaData.nome },
    b1: buildSnapshot(notasB1, 1),
    b2: buildSnapshot(notasB2, 2),
  });
  } catch (err) {
    console.error("[comparativo]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
