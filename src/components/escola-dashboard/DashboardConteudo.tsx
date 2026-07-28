import db from "../../lib/db";
import { cache } from "../../lib/cache";
import { turmasVisiveis } from "../../lib/permissions";
import { capabilitiesFor } from "../../types/roles";
import type { JWTPayload } from "../../lib/auth";

import KPICardsReal from "./KPICardsReal";
import ResumoPedagogico from "./ResumoPedagogico";
import ListaTurmas from "./ListaTurmas";
import HeaderEscola from "./HeaderEscola";
import RankingTurmas from "./RankingTurmas";
import DisciplinasCriticas from "./DisciplinasCriticas";
import TabsDashboard from "./TabsDashboard";
import GraficosVisaoGeral from "./GraficosVisaoGeral";
import HeatmapPedagogico from "./HeatmapPedagogico";
import ComparativoBimestres from "./ComparativoBimestres";
import TendenciaBimestres from "./TendenciaBimestres";
import PainelAlertas from "./PainelAlertas";

import { buildSchoolDashboard } from "../../lib/analytics/buildSchoolDashboard";
import { buildDistribuicaoPedagogica } from "../../lib/analytics/buildDistribuicaoPedagogica";
import { buildAlertas } from "../../lib/analytics/buildAlertas";

import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "../../lib/analytics/types";

async function buscarNotas(escolaId: string, bimestre: number, turmaId?: string): Promise<Nota[]> {
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

interface Props {
  usuario: JWTPayload;
  escolaId: string;
  searchParams: { bimestre?: string; turma?: string; tab?: string };
}

export default async function DashboardConteudo({ usuario, escolaId, searchParams }: Props) {
  const { bimestre: bimestreParam, turma: turmaParam, tab: tabParam } = searchParams;

  const escola = await cache.getOrSet(`escola:${escolaId}`, async () => {
    const rows = await db`SELECT * FROM escolas WHERE id = ${escolaId} LIMIT 1`;
    return rows[0] ?? null;
  });

  if (!escola) {
    return (
      <main className="min-h-screen bg-zinc-900 p-8 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Escola não encontrada</h1>
        </div>
      </main>
    );
  }

  const bimestreAlvo = bimestreParam ? Number(bimestreParam) : (escola.bimestre_atual as number | undefined) ?? 1;

  // PROFESSOR só enxerga as turmas vinculadas a ele; demais papéis com viewAllTurmasDaEscola veem tudo.
  const restringirTurma = !capabilitiesFor(usuario.role).viewAllTurmasDaEscola;
  const turmasPermitidas = restringirTurma ? await turmasVisiveis(usuario, escolaId) : null;

  const turmaIdPedido = turmaParam ?? null;
  const turmaId = turmaIdPedido && (!turmasPermitidas || turmasPermitidas.includes(turmaIdPedido))
    ? turmaIdPedido
    : null;

  const todasTurmasBrutas = await cache.getOrSet(`turmas:${escolaId}`, async () => {
    const rows = await db`
      SELECT * FROM turmas WHERE escola_id = ${escolaId} ORDER BY ano_serie ASC
    `;
    return rows as unknown as Turma[];
  });
  const todasTurmas = turmasPermitidas
    ? (todasTurmasBrutas as Turma[]).filter((t) => turmasPermitidas.includes(t.id))
    : (todasTurmasBrutas as Turma[]);

  const alunosBrutos: Aluno[] = turmaId
    ? ((await db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND ativo = true AND turma_id = ${turmaId}`) as unknown as Aluno[])
    : ((await db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND ativo = true`) as unknown as Aluno[]);
  const alunos = turmasPermitidas
    ? alunosBrutos.filter((a) => turmasPermitidas.includes(a.turma_id as string))
    : alunosBrutos;

  const [disciplinas, matriz] = await Promise.all([
    cache.getOrSet(`disciplinas:${escolaId}`, async () => {
      const rows = await db`SELECT * FROM disciplinas WHERE escola_id = ${escolaId}`;
      return rows as unknown as Disciplina[];
    }),
    cache.getOrSet(`matriz:${escolaId}`, async () => {
      const rows = await db`SELECT * FROM matriz_disciplinas WHERE escola_id = ${escolaId}`;
      return rows as unknown as MatrizDisciplina[];
    }),
  ]);

  const notasBrutas = await buscarNotas(escolaId, bimestreAlvo, turmaId ?? undefined);
  const notas = turmasPermitidas
    ? notasBrutas.filter((n) => turmasPermitidas.includes(n.turma_id as string))
    : notasBrutas;

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

  // Críticos = 4+ disciplinas < 5,0 · Atenção = 2 ou 3 disciplinas < 5,0
  const alertas = buildAlertas({
    alunos: alunos as Aluno[],
    notas: notas as Nota[],
    turmas: turmasParaAnalise,
    disciplinas: disciplinas as Disciplina[],
    matriz: matriz as MatrizDisciplina[],
  });

  const alunosAlerta = [
    ...alertas.criticos.map((item) => ({
      id: item.alunoId,
      nome: item.nome,
      numeroChamada: item.numeroChamada,
      turmaId: item.turmaId,
      turmaNome: item.turmaNome,
      mediaGeral: item.mediaGeral,
      status: "critico" as const,
      totalDisciplinasRisco: item.totalDisciplinasAbaixo,
      disciplinas: item.disciplinasAbaixo.map((d) => ({
        disciplinaId: d.disciplinaId,
        nome: d.disciplinaNome,
        codigo: d.codigo,
        nota: d.nota,
      })),
    })),
    ...alertas.atencao.map((item) => ({
      id: item.alunoId,
      nome: item.nome,
      numeroChamada: item.numeroChamada,
      turmaId: item.turmaId,
      turmaNome: item.turmaNome,
      mediaGeral: item.mediaGeral,
      status: "atencao" as const,
      totalDisciplinasRisco: item.totalDisciplinasAbaixo,
      disciplinas: item.disciplinasAbaixo.map((d) => ({
        disciplinaId: d.disciplinaId,
        nome: d.disciplinaNome,
        codigo: d.codigo,
        nota: d.nota,
      })),
    })),
  ];

  const semDados = notas.length === 0;

  // SUPER_ADMIN navega em /dashboard; os demais papéis ficam presos a /dashboard/escolas/{id}.
  // Os links internos (turma, comparativo, heatmap) precisam apontar pro caminho certo,
  // senão o usuário é redirecionado de volta e perde a seleção.
  const basePath = capabilitiesFor(usuario.role).viewAllEscolas ? "/dashboard" : `/dashboard/escolas/${escolaId}`;

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
          {turmaId && " nesta turma"}. Selecione outro bimestre ou importe os dados.
        </div>
      )}

      <TabsDashboard
        abaInicial={
          (tabParam as "visao" | "turmas" | "disciplinas" | "alertas" | "heatmap" | "comparativo") || "visao"
        }
        comparativo={turmaId ? <ComparativoBimestres turmaId={turmaId} escolaId={escolaId} /> : undefined}
        visaoGeral={
          <div className="space-y-8">
            <KPICardsReal
              totalAlunos={dashboard.alunosAtivos.length}
              totalTurmas={turmasParaAnalise.length}
              mediaGeral={dashboard.mediaGeral}
              alunosCriticos={alertas.criticos.length}
              alunosAbaixoBasico={alertas.abaixoBasico}
              percentualAdequado={dashboard.percentualAdequado}
              totalAdequadosOuAvancados={dashboard.alunosAdequadosOuAvancados.length}
              melhorTurma={dashboard.melhorTurma?.turma.nome ?? "-"}
              melhorTurmaMedia={dashboard.melhorTurma?.media ?? 0}
              turmaAlerta={dashboard.turmaAlerta?.turma.nome ?? "-"}
              turmaAlertaMedia={dashboard.turmaAlerta?.media ?? 0}
              disciplinaCritica={dashboard.disciplinaMaisCritica?.disciplina.nome ?? "-"}
              disciplinaCriticaPercentual={dashboard.disciplinaMaisCritica?.percentual ?? 0}
              alunosAtencao={alertas.atencao.length}
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

            <TendenciaBimestres turmaId={turmaId} escolaId={escolaId} />

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResumoPedagogico
                alunosAtencao={alertas.atencao.length}
                alunosTransferidos={dashboard.alunosTransferidos.length}
                totalNotas={dashboard.notasValidas.length}
                bimestre={bimestreAlvo}
                anoLetivo={(escola.ano_letivo as number | undefined) ?? 2026}
              />
              <ListaTurmas
                basePath={basePath}
                turmas={dashboard.rankingTurmas.map((r) => ({
                  id: r.turma.id,
                  nome: r.turma.nome,
                  total_ativos: r.turma.total_ativos ?? 0,
                  media: r.media,
                }))}
              />
            </section>
          </div>
        }
        turmas={
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RankingTurmas ranking={dashboard.rankingTurmas} basePath={basePath} />
            <ResumoPedagogico
              alunosAtencao={alertas.atencao.length}
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
            turmas={(todasTurmas as Turma[]).map((t) => ({ id: t.id, nome: t.nome }))}
          />
        }
        heatmap={<HeatmapPedagogico bimestre={bimestreAlvo} turmaId={turmaId} escolaId={escolaId} />}
      />
    </main>
  );
}
