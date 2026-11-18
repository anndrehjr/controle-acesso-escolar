import { notFound, redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { requireAuth } from "../../lib/requireAuth";
import db from "../../lib/db";
import { resolveEscolaAccess, turmasVisiveis } from "../../lib/permissions";
import { buildSchoolDashboard } from "../../lib/analytics/buildSchoolDashboard";
import { buildExecutivo, gerarObservacoes } from "../../lib/analytics/buildExecutivo";
import { separarTurmasPorNivel } from "../../lib/analytics/nivelEnsino";
import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "../../lib/analytics/types";

import AnalyticsHeaderNav from "../../components/analytics/AnalyticsHeaderNav";
import ResumoCards from "../../components/analytics/ResumoCards";
import TabelaComparativa from "../../components/analytics/TabelaComparativa";
import VariacaoAbaixoMediaCard from "../../components/analytics/RecomposicaoCard";
import AlertasTextoList from "../../components/analytics/AlertasTextoList";
import TendenciaBimestres from "../../components/escola-dashboard/TendenciaBimestres";
import DisciplinasCriticas from "../../components/escola-dashboard/DisciplinasCriticas";

const DEFAULT_ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

type PageProps = {
  searchParams: Promise<{ escolaId?: string }>;
};

type VariacaoAbaixoMediaItem = {
  disciplina: { id: string; nome: string };
  abaixoB1: number;
  abaixoB2: number;
  reducaoAbaixoMedia: number;
};

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const usuario = await requireAuth();
  if (!usuario) redirect("/login");

  const { escolaId: escolaIdParam } = await searchParams;
  const escolaIdPedido = escolaIdParam ?? usuario.escola_id ?? DEFAULT_ESCOLA_ID;
  const escolaId = resolveEscolaAccess(usuario, escolaIdPedido);
  if (!escolaId) notFound();

  const escolaRows = await db`SELECT * FROM escolas WHERE id = ${escolaId} LIMIT 1`;
  const escola = escolaRows[0];
  if (!escola) notFound();

  const anoLetivo = (escola.ano_letivo as number | undefined) ?? 2026;
  const turmasPermitidas = await turmasVisiveis(usuario, escolaId);

  const [turmasRows, alunosRows, disciplinasRows, matrizRows] = await Promise.all([
    db`SELECT * FROM turmas WHERE escola_id = ${escolaId} AND id = ANY(${turmasPermitidas}::uuid[]) ORDER BY ano_serie ASC`,
    db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND ativo = true AND turma_id = ANY(${turmasPermitidas}::uuid[])`,
    db`SELECT * FROM disciplinas WHERE escola_id = ${escolaId}`,
    db`SELECT * FROM matriz_disciplinas WHERE escola_id = ${escolaId}`,
  ]);

  const turmas = turmasRows as unknown as Turma[];
  const alunos = alunosRows as unknown as Aluno[];
  const disciplinas = disciplinasRows as unknown as Disciplina[];
  const matriz = matrizRows as unknown as MatrizDisciplina[];

  const todasNotas = await db`
    SELECT * FROM notas
    WHERE escola_id = ${escolaId}
      AND ano_letivo = ${anoLetivo}
      AND turma_id = ANY(${turmasPermitidas}::uuid[])
  ` as unknown as Nota[];

  // Dashboard executivo: evolucao por bimestre, rankings e alunos em risco, sempre
  // limitado a escola e as turmas autorizadas para o usuario autenticado.
  const executivo = buildExecutivo({ alunos, turmas, disciplinas, matriz, todasNotas, anoLetivo });
  const bimestreAtual = executivo.ultimoBimestreComDados;

  const notasPorBim = (b: number) => todasNotas.filter((n) => Number(n.bimestre) === b);
  const notasB = [1, 2, 3, 4].map((_, i) => notasPorBim(i + 1));

  const dashAtual = buildSchoolDashboard({
    alunos,
    notas: notasPorBim(bimestreAtual),
    turmas,
    disciplinas,
    bimestre: bimestreAtual,
    anoLetivo,
  });

  const totalAlunos = alunos.filter((a) => a.status !== "TRANSFERIDO").length;

  const { fundamental: turmasFund, medio: turmasMedio } = separarTurmasPorNivel(turmas);
  const idsTurmasFund = new Set(turmasFund.map((t) => t.id));
  const idsTurmasMedio = new Set(turmasMedio.map((t) => t.id));

  function montarTabelaDisciplinas(idsTurmasDoNivel: Set<string>) {
    return disciplinas
      .map((d) => {
        const bims = notasB.map((notas, idx) => {
          const nd = notas.filter((n) => n.disciplina_id === d.id && idsTurmasDoNivel.has(n.turma_id));
          const media = nd.length > 0 ? Number((nd.reduce((s, n) => s + Number(n.nota), 0) / nd.length).toFixed(1)) : null;
          return { bimestre: idx + 1, media, temDados: nd.length > 0 };
        });
        const primeiro = bims.find((b) => b.temDados);
        const ultimo = [...bims].reverse().find((b) => b.temDados);
        const evolucao =
          primeiro && ultimo && primeiro !== ultimo && primeiro.media !== null && ultimo.media !== null
            ? Number((ultimo.media - primeiro.media).toFixed(1))
            : null;
        return { disciplina: d, bims, evolucao };
      })
      .filter((r) => r.bims.some((b) => b.temDados));
  }

  const tabelaDisciplinasFundamental = montarTabelaDisciplinas(idsTurmasFund);
  const tabelaDisciplinasMedio = montarTabelaDisciplinas(idsTurmasMedio);

  // Comparacao agregada B1 x B2. Nao representa recuperacao individual.
  const variacaoAbaixoMedia: VariacaoAbaixoMediaItem[] = bimestreAtual >= 2
    ? disciplinas.flatMap((d) => {
        const b1 = notasB[0].filter((n) => n.disciplina_id === d.id);
        const b2 = notasB[1].filter((n) => n.disciplina_id === d.id);
        if (b1.length === 0 || b2.length === 0) return [];
        const abaixoB1 = b1.filter((n) => Number(n.nota) < 5).length;
        const abaixoB2 = b2.filter((n) => Number(n.nota) < 5).length;
        return [{
          disciplina: d,
          abaixoB1,
          abaixoB2,
          reducaoAbaixoMedia: Math.max(0, abaixoB1 - abaixoB2),
        }];
      })
    : [];

  const alertasTexto = gerarObservacoes(executivo);

  return (
    <main className="min-h-screen p-6 md:p-8 space-y-8">
      <AnalyticsHeaderNav
        nome={escola.nome as string}
        cidade={(escola.cidade as string | undefined) ?? ""}
        estado={(escola.estado as string | undefined) ?? ""}
        bimestre={bimestreAtual}
        anoLetivo={anoLetivo}
      />

      <ResumoCards executivo={executivo} totalAlunos={totalAlunos} />

      <TendenciaBimestres escolaId={escolaId} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TabelaComparativa
          disciplinasFundamental={tabelaDisciplinasFundamental}
          disciplinasMedio={tabelaDisciplinasMedio}
          bimestreAtual={bimestreAtual}
        />
        <DisciplinasCriticas
          geral={dashAtual.disciplinasCriticasGeral}
          fundamental={dashAtual.disciplinasCriticasFundamental}
          medio={dashAtual.disciplinasCriticasMedio}
        />
      </div>

      {variacaoAbaixoMedia.length > 0 && (
        <VariacaoAbaixoMediaCard disciplinas={variacaoAbaixoMedia} />
      )}

      <AlertasTextoList alertas={alertasTexto} />
    </main>
  );
}
