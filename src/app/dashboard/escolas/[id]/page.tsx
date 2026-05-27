import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

import KPICardsReal from "../../../../components/escola-dashboard/KPICardsReal";
import ResumoPedagogico from "../../../../components/escola-dashboard/ResumoPedagogico";
import ListaTurmas from "../../../../components/escola-dashboard/ListaTurmas";
import HeaderEscola from "../../../../components/escola-dashboard/HeaderEscola";
import RankingTurmas from "../../../../components/escola-dashboard/RankingTurmas";
import DisciplinasCriticas from "../../../../components/escola-dashboard/DisciplinasCriticas";
import TabsDashboard from "../../../../components/escola-dashboard/TabsDashboard";
import GraficosVisaoGeral from "../../../../components/escola-dashboard/GraficosVisaoGeral";
import HeatmapPedagogico from "../../../../components/escola-dashboard/HeatmapPedagogico";

import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import { buildDistribuicaoPedagogica } from "../../../../lib/analytics/buildDistribuicaoPedagogica";

import type {
  Aluno,
  Disciplina,
  Nota,
  Turma,
} from "../../../../lib/analytics/types";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function buscarTodasNotas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  escolaId: string
) {
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
      .range(inicio, fim);

    if (error) {
      console.error("Erro ao buscar notas:", error);
      break;
    }

    if (!data || data.length === 0) break;

    todasNotas = [...todasNotas, ...(data as Nota[])];

    if (data.length < tamanhoPagina) break;

    pagina++;
  }

  return todasNotas;
}

export default async function EscolaPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!perfil || perfil.ativo === false) {
    redirect("/login");
  }

  const { data: escola } = await supabase
    .from("escolas")
    .select("*")
    .eq("id", id)
    .single();

  if (!escola) {
    redirect("/dashboard");
  }

  const podeAcessar =
    perfil.role === "SUPER_ADMIN" ||
    (perfil.role === "ADMIN_ESCOLA" && perfil.escola_id === escola.id);

  if (!podeAcessar) {
    redirect("/dashboard");
  }

  const { data: turmas = [] } = await supabase
    .from("turmas")
    .select("*")
    .eq("escola_id", escola.id)
    .order("ano_serie", { ascending: true });

  const { data: alunos = [] } = await supabase
    .from("alunos")
    .select("*")
    .eq("escola_id", escola.id)
    .eq("ativo", true);

  const { data: disciplinas = [] } = await supabase
    .from("disciplinas")
    .select("*")
    .eq("escola_id", escola.id);

  const { data: matriz = [] } = await supabase
    .from("matriz_disciplinas")
    .select("*")
    .eq("escola_id", escola.id);

  const notas = await buscarTodasNotas(supabase, escola.id);

  const dashboard = buildSchoolDashboard({
    alunos: alunos as Aluno[],
    notas: notas as Nota[],
    turmas: turmas as Turma[],
    disciplinas: disciplinas as Disciplina[],
    bimestre: escola.bimestre_atual ?? 1,
    anoLetivo: escola.ano_letivo ?? 2026,
  });

  const distribuicaoPedagogica = buildDistribuicaoPedagogica({
    alunos: alunos as Aluno[],
    notas: notas as Nota[],
    turmas: turmas as Turma[],
  });



  return (
    <main className="min-h-screen bg-zinc-900 p-8">
      <HeaderEscola
        nome={escola.nome}
        cidade={escola.cidade}
        estado={escola.estado}
        bimestre={escola.bimestre_atual ?? 1}
        anoLetivo={escola.ano_letivo ?? 2026}
        role={perfil.role}
      />

      <TabsDashboard
        visaoGeral={
          <div className="space-y-8">
            <KPICardsReal
              totalAlunos={dashboard.alunosAtivos.length}
              totalTurmas={(turmas as Turma[]).length}
              mediaGeral={dashboard.mediaGeral}
              alunosCriticos={dashboard.alunosCriticos.length}
              alunosAbaixoBasico={dashboard.alunosCriticos.length}
              percentualAdequado={dashboard.percentualAdequado}
              totalAdequadosOuAvancados={
                dashboard.alunosAdequadosOuAvancados.length
              }
              melhorTurma={dashboard.melhorTurma?.turma.nome ?? "-"}
              melhorTurmaMedia={dashboard.melhorTurma?.media ?? 0}
              turmaAlerta={dashboard.turmaAlerta?.turma.nome ?? "-"}
              turmaAlertaMedia={dashboard.turmaAlerta?.media ?? 0}
              disciplinaCritica={
                dashboard.disciplinaMaisCritica?.disciplina.nome ?? "-"
              }
              disciplinaCriticaPercentual={
                dashboard.disciplinaMaisCritica?.percentual ?? 0
              }
              alunosAtencao={dashboard.alunosAtencao}
            />

            <GraficosVisaoGeral
              distribuicaoPorTurma={
                distribuicaoPedagogica.distribuicaoPorTurma
              }
              distribuicaoGeral={distribuicaoPedagogica.distribuicaoGeral}
            />

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResumoPedagogico
                alunosAtencao={dashboard.alunosAtencao}
                alunosTransferidos={dashboard.alunosTransferidos.length}
                totalNotas={dashboard.notasValidas.length}
                bimestre={escola.bimestre_atual ?? 1}
                anoLetivo={escola.ano_letivo ?? 2026}
              />

              <ListaTurmas turmas={(turmas as Turma[]) ?? []} />
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
              bimestre={escola.bimestre_atual ?? 1}
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold">Alertas Pedagógicos</h2>  
            <p className="text-zinc-400 mt-2">
              Aqui vamos listar alunos críticos, turmas em alerta e pontos de
              atenção.
            </p>
          </div>
        }
        heatmap={<HeatmapPedagogico escolaId={escola.id} />}
      />
    </main>
  );
}