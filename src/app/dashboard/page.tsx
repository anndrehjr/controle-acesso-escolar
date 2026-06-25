import { redirect } from "next/navigation";
import { requireAuth } from "../../lib/requireAuth";
import db from "../../lib/db";
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
import PainelAlertas from "../../components/escola-dashboard/PainelAlertas";

import { buildSchoolDashboard } from "../../lib/analytics/buildSchoolDashboard";
import { buildDistribuicaoPedagogica } from "../../lib/analytics/buildDistribuicaoPedagogica";
import { buildAlunosRisco } from "../../lib/analytics/buildAlunosRisco";

import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "../../lib/analytics/types";

const ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

async function buscarNotas(
  escolaId: string,
  bimestre: number,
  turmaId?: string
): Promise<Nota[]> {
  if (turmaId) {
    const rows = await db`
      SELECT * FROM notas
      WHERE escola_id = ${escolaId} AND bimestre = ${bimestre} AND turma_id = ${turmaId}
    `;
    return rows as unknown as Nota[];
  }
  const rows = await db`
    SELECT * FROM notas
    WHERE escola_id = ${escolaId} AND bimestre = ${bimestre}
  `;
  return rows as unknown as Nota[];
}

type PageProps = {
  searchParams: Promise<{ bimestre?: string; turma?: string; tab?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const usuario = await requireAuth();
  if (!usuario) redirect("/login");

  const { bimestre: bimestreParam, turma: turmaParam, tab: tabParam } = await searchParams;

  const escola = await cache.getOrSet(`escola:${ESCOLA_ID}`, async () => {
    const rows = await db`SELECT * FROM escolas WHERE id = ${ESCOLA_ID} LIMIT 1`;
    return rows[0] ?? null;
  });

  if (!escola) {
    return (
      <main className="min-h-screen bg-zinc-900 p-8 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Escola não encontrada</h1>
          <p className="mt-2 text-zinc-400">
            Verifique NEXT_PUBLIC_ESCOLA_ID no .env.local
          </p>
        </div>
      </main>
    );
  }

  const bimestreAlvo = bimestreParam ? Number(bimestreParam) : (escola.bimestre_atual as number | undefined) ?? 1;
  const turmaId = turmaParam ?? null;

  const todasTurmas = await cache.getOrSet(`turmas:${ESCOLA_ID}`, async () => {
    const rows = await db`
      SELECT * FROM turmas WHERE escola_id = ${ESCOLA_ID} ORDER BY ano_serie ASC
    `;
    return rows as unknown as Turma[];
  });

  const alunos: Aluno[] = turmaId
    ? (await db`SELECT * FROM alunos WHERE escola_id = ${ESCOLA_ID} AND ativo = true AND turma_id = ${turmaId}`) as unknown as Aluno[]
    : (await db`SELECT * FROM alunos WHERE escola_id = ${ESCOLA_ID} AND ativo = true`) as unknown as Aluno[];

  const [disciplinas, matriz] = await Promise.all([
    cache.getOrSet(`disciplinas:${ESCOLA_ID}`, async () => {
      const rows = await db`SELECT * FROM disciplinas WHERE escola_id = ${ESCOLA_ID}`;
      return rows as unknown as Disciplina[];
    }),
    cache.getOrSet(`matriz:${ESCOLA_ID}`, async () => {
      const rows = await db`SELECT * FROM matriz_disciplinas WHERE escola_id = ${ESCOLA_ID}`;
      return rows as unknown as MatrizDisciplina[];
    }),
  ]);

  const notas = await buscarNotas(ESCOLA_ID, bimestreAlvo, turmaId ?? undefined);

  const turmasParaAnalise = turmaId
    ? (todasTurmas as Turma[]).filter((t) => t.id === turmaId)
    : (todasTurmas as Turma[]);

  const dashboard = buildSchoolDashboard({
    alunos: alunos as Aluno[],
    notas: notas as Nota[],
    turmas: turmasParaAnalise,
    disciplinas: disciplinas as Disciplina[],
    bimestre: bimestreAlvo,
    anoLetivo: (escola.ano_letivo as number | undefined) ?? 2026,
  });

  const distribuicaoPedagogica = buildDistribuicaoPedagogica({
    alunos: alunos as Aluno[],
    notas: notas as Nota[],
    turmas: turmasParaAnalise,
  });

  const risco = buildAlunosRisco({
    alunos: alunos as Aluno[],
    notas: notas as Nota[],
    turmas: turmasParaAnalise,
    disciplinas: disciplinas as Disciplina[],
    matriz: matriz as MatrizDisciplina[],
  });

  const semDados = notas.length === 0;

  // Críticos = média < 5 · Atenção = faixa básico (5,0–6,9)
  const criticosIds = new Set(dashboard.alunosCriticos.map(item => item.aluno.id));
  const riscoMap = new Map(risco.alunosRisco.map(a => [a.alunoId, a]));
  const alunosBasico = dashboard.mediasPorAluno.filter(
    item => item.nivel === "basico" && item.media !== null
  );

  const alunosAlerta = [
    ...dashboard.alunosCriticos.map(item => {
      const riscoData = riscoMap.get(item.aluno.id);
      const turma = (todasTurmas as Turma[]).find(t => t.id === item.aluno.turma_id);
      return {
        id: item.aluno.id,
        nome: item.aluno.nome,
        numeroChamada: item.aluno.numero_chamada,
        turmaId: item.aluno.turma_id,
        turmaNome: turma?.nome ?? "Turma",
        mediaGeral: item.media,
        status: "critico" as const,
        totalDisciplinasRisco: riscoData?.totalDisciplinasRisco ?? 0,
        disciplinas: (riscoData?.disciplinasRisco ?? []).map(d => ({
          disciplinaId: d.disciplinaId,
          nome: d.disciplinaNome,
          codigo: d.codigo,
          nota: d.nota,
        })),
      };
    }),
    ...alunosBasico.map(item => {
      const riscoData = riscoMap.get(item.aluno.id);
      const turma = (todasTurmas as Turma[]).find(t => t.id === item.aluno.turma_id);
      return {
        id: item.aluno.id,
        nome: item.aluno.nome,
        numeroChamada: item.aluno.numero_chamada,
        turmaId: item.aluno.turma_id,
        turmaNome: turma?.nome ?? "Turma",
        mediaGeral: item.media,
        status: "atencao" as const,
        totalDisciplinasRisco: riscoData?.totalDisciplinasRisco ?? 0,
        disciplinas: (riscoData?.disciplinasRisco ?? []).map(d => ({
          disciplinaId: d.disciplinaId,
          nome: d.disciplinaNome,
          codigo: d.codigo,
          nota: d.nota,
        })),
      };
    }),
  ];

  return (
    <main className="min-h-screen bg-zinc-900 p-6 md:p-8">
      <HeaderEscola
        nome={escola.nome as string}
        cidade={(escola.cidade as string | undefined) ?? ""}
        estado={(escola.estado as string | undefined) ?? ""}
        bimestre={bimestreAlvo}
        anoLetivo={(escola.ano_letivo as number | undefined) ?? 2026}
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
                anoLetivo={(escola.ano_letivo as number | undefined) ?? 2026}
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
              anoLetivo={(escola.ano_letivo as number | undefined) ?? 2026}
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
          <PainelAlertas
            alunosAlerta={alunosAlerta}
            bimestre={bimestreAlvo}
            turmas={(todasTurmas as Turma[]).map(t => ({ id: t.id, nome: t.nome }))}
          />
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
