import { createClient } from "../../lib/supabase/server";
import { cache } from "../../lib/cache";

import KPICardsReal from "../../components/escola-dashboard/KPICardsReal";
import ResumoPedagogico from "../../components/escola-dashboard/ResumoPedagogico";
import ListaTurmas from "../../components/escola-dashboard/ListaTurmas";
import HeaderEscola from "../../components/escola-dashboard/HeaderEscola";
import RankingTurmas from "../../components/escola-dashboard/RankingTurmas";
import DisciplinasCriticas from "../../components/escola-dashboard/DisciplinasCriticas";
import TabsDashboard from "../../components/escola-dashboard/TabsDashboard";
import GraficosVisaoGeral from "../../components/escola-dashboard/GraficosVisaoGeral";
import HeatmapPedagogico from "../../components/escola-dashboard/HeatmapPedagogico";
import ComparativoBimestres from "../../components/escola-dashboard/ComparativoBimestres";
import TendenciaBimestres from "../../components/escola-dashboard/TendenciaBimestres";

import { buildSchoolDashboard } from "../../lib/analytics/buildSchoolDashboard";
import { buildDistribuicaoPedagogica } from "../../lib/analytics/buildDistribuicaoPedagogica";

import type { Aluno, Disciplina, Nota, Turma } from "../../lib/analytics/types";

const ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

async function buscarNotas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  escolaId: string,
  bimestre: number,
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
      .eq("bimestre", bimestre)
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

type PageProps = {
  searchParams: Promise<{ bimestre?: string; turma?: string; tab?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { bimestre: bimestreParam, turma: turmaParam, tab: tabParam } = await searchParams;

  const escola = await cache.getOrSet(`escola:${ESCOLA_ID}`, async () => {
    const { data } = await supabase.from("escolas").select("*").eq("id", ESCOLA_ID).single();
    return data;
  });

  if (!escola) {
    return (
      <main className="min-h-screen bg-zinc-900 p-8 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Escola não encontrada</h1>
          <p className="mt-2 text-zinc-400">
            Execute o schema.sql no Supabase e verifique NEXT_PUBLIC_ESCOLA_ID no .env.local
          </p>
        </div>
      </main>
    );
  }

  const bimestreAlvo = bimestreParam ? Number(bimestreParam) : escola.bimestre_atual ?? 1;
  const turmaId = turmaParam ?? null;

  // Busca todas as turmas sempre (para o seletor e ranking completo)
  const todasTurmas = await cache.getOrSet(`turmas:${ESCOLA_ID}`, async () => {
    const { data } = await supabase
      .from("turmas")
      .select("*")
      .eq("escola_id", ESCOLA_ID)
      .order("ano_serie", { ascending: true });
    return (data ?? []) as Turma[];
  });

  // Alunos e notas: filtrados pela turma se selecionada
  const alunosQuery = supabase
    .from("alunos")
    .select("*")
    .eq("escola_id", ESCOLA_ID)
    .eq("ativo", true);

  const { data: alunos = [] } = turmaId
    ? await alunosQuery.eq("turma_id", turmaId)
    : await alunosQuery;

  const [disciplinas, matriz] = await Promise.all([
    cache.getOrSet(`disciplinas:${ESCOLA_ID}`, async () => {
      const { data } = await supabase.from("disciplinas").select("*").eq("escola_id", ESCOLA_ID);
      return (data ?? []) as Disciplina[];
    }),
    cache.getOrSet(`matriz:${ESCOLA_ID}`, async () => {
      const { data } = await supabase.from("matriz_disciplinas").select("*").eq("escola_id", ESCOLA_ID);
      return data ?? [];
    }),
  ]);

  const notas = await buscarNotas(supabase, ESCOLA_ID, bimestreAlvo, turmaId ?? undefined);

  // Turmas a exibir no dashboard: todas (para ranking de contexto) ou só a selecionada
  const turmasParaAnalise = turmaId
    ? (todasTurmas as Turma[]).filter((t) => t.id === turmaId)
    : (todasTurmas as Turma[]);

  const dashboard = buildSchoolDashboard({
    alunos: alunos as Aluno[],
    notas: notas as Nota[],
    turmas: turmasParaAnalise,
    disciplinas: disciplinas as Disciplina[],
    bimestre: bimestreAlvo,
    anoLetivo: escola.ano_letivo ?? 2026,
  });

  const distribuicaoPedagogica = buildDistribuicaoPedagogica({
    alunos: alunos as Aluno[],
    notas: notas as Nota[],
    turmas: turmasParaAnalise,
  });

  const semDados = notas.length === 0;

  return (
    <main className="min-h-screen bg-zinc-900 p-6 md:p-8">
      <HeaderEscola
        nome={escola.nome}
        cidade={escola.cidade ?? ""}
        estado={escola.estado ?? ""}
        bimestre={bimestreAlvo}
        anoLetivo={escola.ano_letivo ?? 2026}
        turmas={(todasTurmas as Turma[]).map((t) => ({ id: t.id, nome: t.nome }))}
        turmaAtualId={turmaId}
      />

      {semDados && (
        <div className="mt-6 rounded-2xl border border-yellow-900/40 bg-yellow-950/30 px-5 py-4 text-yellow-300 text-sm">
          Nenhuma nota encontrada para o <strong>{bimestreAlvo}º bimestre</strong>
          {turmaId && " nesta turma"}.{" "}
          Selecione outro bimestre ou importe os dados.
        </div>
      )}

      <TabsDashboard
        abaInicial={
          (tabParam as "visao" | "turmas" | "disciplinas" | "alertas" | "heatmap" | "comparativo") ||
          "visao"
        }
        comparativo={
          turmaId ? <ComparativoBimestres turmaId={turmaId} /> : undefined
        }
        visaoGeral={
          <div className="space-y-8">
            <KPICardsReal
              totalAlunos={dashboard.alunosAtivos.length}
              totalTurmas={turmasParaAnalise.length}
              mediaGeral={dashboard.mediaGeral}
              alunosCriticos={dashboard.alunosCriticos.length}
              alunosAbaixoBasico={dashboard.alunosCriticos.length}
              percentualAdequado={dashboard.percentualAdequado}
              totalAdequadosOuAvancados={dashboard.alunosAdequadosOuAvancados.length}
              melhorTurma={dashboard.melhorTurma?.turma.nome ?? "-"}
              melhorTurmaMedia={dashboard.melhorTurma?.media ?? 0}
              turmaAlerta={dashboard.turmaAlerta?.turma.nome ?? "-"}
              turmaAlertaMedia={dashboard.turmaAlerta?.media ?? 0}
              disciplinaCritica={dashboard.disciplinaMaisCritica?.disciplina.nome ?? "-"}
              disciplinaCriticaPercentual={dashboard.disciplinaMaisCritica?.percentual ?? 0}
              alunosAtencao={dashboard.alunosAtencao}
              turmaFiltrada={!!turmaId}
              melhorAluno={
                dashboard.melhorAlunoDaTurma
                  ? {
                      id: dashboard.melhorAlunoDaTurma.aluno.id,
                      nome: dashboard.melhorAlunoDaTurma.aluno.nome,
                      numeroChamada: dashboard.melhorAlunoDaTurma.aluno.numero_chamada,
                      media: dashboard.melhorAlunoDaTurma.media,
                    }
                  : null
              }
              pioresAlunos={dashboard.pioresAlunosDaTurma.map((item) => ({
                id: item.aluno.id,
                nome: item.aluno.nome,
                numeroChamada: item.aluno.numero_chamada,
                media: item.media,
              }))}
            />

            <GraficosVisaoGeral
              distribuicaoPorTurma={distribuicaoPedagogica.distribuicaoPorTurma}
              distribuicaoGeral={distribuicaoPedagogica.distribuicaoGeral}
            />

            <TendenciaBimestres turmaId={turmaId} />

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResumoPedagogico
                alunosAtencao={dashboard.alunosAtencao}
                alunosTransferidos={dashboard.alunosTransferidos.length}
                totalNotas={dashboard.notasValidas.length}
                bimestre={bimestreAlvo}
                anoLetivo={escola.ano_letivo ?? 2026}
              />
              <ListaTurmas turmas={turmasParaAnalise} />
            </section>
          </div>
        }
        turmas={
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RankingTurmas ranking={dashboard.rankingTurmas} />
            <ResumoPedagogico
              alunosAtencao={dashboard.alunosAtencao}
              alunosTransferidos={dashboard.alunosTransferidos.length}
              totalNotas={dashboard.notasValidas.length}
              bimestre={bimestreAlvo}
              anoLetivo={escola.ano_letivo ?? 2026}
            />
          </div>
        }
        disciplinas={
          <DisciplinasCriticas
            geral={dashboard.disciplinasCriticasGeral}
            fundamental={dashboard.disciplinasCriticasFundamental}
            medio={dashboard.disciplinasCriticasMedio}
          />
        }
        alertas={
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
            <div className="relative z-10 mb-6 flex items-center justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full border border-red-900/60 bg-red-950/40 px-3 py-1 text-xs font-medium text-red-400">
                  Situação crítica
                </div>
                <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                  Alertas Pedagógicos
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Média abaixo de 5,0 — {bimestreAlvo}º bimestre
                  {turmaId
                    ? ` · ${(todasTurmas as Turma[]).find((t) => t.id === turmaId)?.nome ?? "Turma"}`
                    : " · Todas as turmas"}
                  . Ordenados do mais crítico ao menos crítico.
                </p>
              </div>
              <div className="rounded-2xl border border-red-900/40 bg-red-950/30 px-5 py-4 text-center">
                <span className="text-4xl font-black text-red-300">
                  {dashboard.alunosCriticos.length}
                </span>
                <p className="text-xs font-semibold text-red-500">críticos</p>
              </div>
            </div>

            <div className="relative z-10 space-y-3">
              {dashboard.alunosCriticos
                .slice()
                .sort((a, b) => (a.media ?? 10) - (b.media ?? 10))
                .map((item, idx) => {
                  const turma = (todasTurmas as Turma[]).find(
                    (t) => t.id === item.aluno.turma_id
                  );
                  return (
                    <div
                      key={item.aluno.id}
                      className="flex items-center gap-4 rounded-2xl border border-red-900/30 bg-red-950/20 px-4 py-3 transition hover:border-red-700/50 hover:bg-red-950/30"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-900/40 bg-red-950/60 text-sm font-black text-red-400">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-red-200">{item.aluno.nome}</p>
                        <p className="text-xs text-zinc-500">
                          {turma?.nome ?? "Turma não identificada"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-red-400">
                          {item.media !== null ? item.media.toFixed(1) : "-"}
                        </span>
                        <p className="text-xs text-zinc-600">média</p>
                      </div>
                    </div>
                  );
                })}
              {dashboard.alunosCriticos.length === 0 && (
                <p className="text-zinc-400">
                  {semDados
                    ? "Sem dados para este bimestre."
                    : "Nenhum aluno em situação crítica."}
                </p>
              )}
            </div>
          </div>
        }
        heatmap={
          <HeatmapPedagogico
            bimestre={bimestreAlvo}
            turmaId={turmaId}
          />
        }
      />
    </main>
  );
}
