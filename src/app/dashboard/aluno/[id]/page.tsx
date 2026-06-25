import { redirect } from "next/navigation";
import { requireAuth } from "../../../../lib/requireAuth";
import db from "../../../../lib/db";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from "lucide-react";
import { cache } from "../../../../lib/cache";
import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "../../../../lib/analytics/types";

const ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bimestre?: string; turmaId?: string }>;
};

function getNivel(media: number) {
  if (media < 5) return { label: "Abaixo do Básico", cor: "text-red-300 border-red-500/30 bg-red-950/30" };
  if (media < 7) return { label: "Básico",           cor: "text-amber-300 border-amber-500/30 bg-amber-950/30" };
  if (media < 9) return { label: "Adequado",         cor: "text-green-300 border-green-500/30 bg-green-950/30" };
  return               { label: "Avançado",          cor: "text-blue-300 border-blue-500/30 bg-blue-950/30" };
}

function getClasseNota(nota: number | null, destaque = false) {
  const base = destaque ? "ring-2" : "ring-1";
  if (nota === null) return `bg-zinc-800 text-zinc-500 ${base} ring-zinc-700`;
  if (nota < 5)  return `bg-red-500/15 text-red-300 ${base} ring-red-500/30`;
  if (nota < 7)  return `bg-amber-500/15 text-amber-300 ${base} ring-amber-500/30`;
  if (nota < 9)  return `bg-green-500/15 text-green-300 ${base} ring-green-500/30`;
  return              `bg-blue-500/15 text-blue-300 ${base} ring-blue-500/30`;
}

function inferirGrupo(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("série") || n.includes("serie") || n.includes("médio") || n.includes("medio")) return "EM";
  if (n.includes("ano") || n.includes("fundamental")) return "EF";
  return "";
}

async function buscarNotasBimestre(alunoId: string, bimestre: number): Promise<Nota[]> {
  const rows = await db`
    SELECT * FROM notas
    WHERE escola_id = ${ESCOLA_ID} AND aluno_id = ${alunoId} AND bimestre = ${bimestre}
  `;
  return rows as unknown as Nota[];
}

export default async function AlunoPage({ params, searchParams }: PageProps) {
  const usuario = await requireAuth();
  if (!usuario) redirect("/login");

  const { id } = await params;
  const { turmaId: turmaIdParam } = await searchParams;

  const [alunoRaw, escola, disciplinas, matriz] = await Promise.all([
    cache.getOrSet(`aluno:${ESCOLA_ID}:${id}`, async () => {
      const rows = await db`SELECT * FROM alunos WHERE id = ${id} AND escola_id = ${ESCOLA_ID} LIMIT 1`;
      return (rows[0] ?? null) as Aluno | null;
    }),
    cache.getOrSet(`escola:${ESCOLA_ID}`, async () => {
      const rows = await db`SELECT * FROM escolas WHERE id = ${ESCOLA_ID} LIMIT 1`;
      return rows[0] ?? null;
    }),
    cache.getOrSet(`disciplinas:${ESCOLA_ID}`, async () => {
      const rows = await db`SELECT * FROM disciplinas WHERE escola_id = ${ESCOLA_ID}`;
      return rows as unknown as Disciplina[];
    }),
    cache.getOrSet(`matriz:${ESCOLA_ID}`, async () => {
      const rows = await db`SELECT * FROM matriz_disciplinas WHERE escola_id = ${ESCOLA_ID}`;
      return rows as unknown as MatrizDisciplina[];
    }),
  ]);

  if (!alunoRaw) {
    return (
      <main className="min-h-screen bg-zinc-900 p-8 text-white">
        <p className="text-red-400">Aluno não encontrado.</p>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar ao dashboard
        </Link>
      </main>
    );
  }

  const aluno = alunoRaw as Aluno;
  const bimestreAtual = (escola?.bimestre_atual as number | undefined) ?? 1;
  const bimestres = [1, 2, 3, 4];

  const turma = await cache.getOrSet(`turma:${aluno.turma_id}`, async () => {
    const rows = await db`SELECT * FROM turmas WHERE id = ${aluno.turma_id} LIMIT 1`;
    return (rows[0] ?? null) as Turma | null;
  });

  // grupo_pedagogico with fallback to name inference
  const grpRaw = String(turma?.grupo_pedagogico ?? "").trim().toUpperCase();
  const grupo = grpRaw || inferirGrupo(turma?.nome ?? "");

  const matrizDaTurma = (matriz as MatrizDisciplina[])
    .filter((m) => String(m.etapa ?? "").trim().toUpperCase() === grupo)
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  const disciplinasDaTurma = matrizDaTurma
    .map((m) => {
      const disc = (disciplinas as Disciplina[]).find(
        (d) => String(d.id).trim() === String(m.disciplina_id).trim()
      );
      if (!disc) return null;
      return { id: disc.id, nome: disc.nome, codigo: m.codigo };
    })
    .filter((item): item is { id: string; nome: string; codigo: string } => item !== null);

  const notasPorBimestre = await Promise.all(
    bimestres.map(async (b) => ({
      bimestre: b,
      notas: await cache.getOrSet(`notas:aluno:${aluno.id}:bim:${b}`, () =>
        buscarNotasBimestre(aluno.id, b)
      ),
    }))
  );

  const tabelaDisciplinas = disciplinasDaTurma.map((disc) => {
    const notasBim = bimestres.map((b) => {
      const grupo = notasPorBimestre.find((g) => g.bimestre === b);
      const nota = grupo?.notas.find(
        (n) => String(n.disciplina_id).trim() === String(disc.id).trim()
      );
      return nota?.nota !== null && nota?.nota !== undefined ? Number(nota.nota) : null;
    });

    const notasValidas = notasBim.filter((n): n is number => n !== null);
    const media =
      notasValidas.length > 0
        ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length
        : null;

    // Trend: delta between the last two bimestres that have data
    const idxComDados = notasBim
      .map((n, i) => (n !== null ? i : -1))
      .filter((i) => i >= 0);
    let tendencia: number | null = null;
    if (idxComDados.length >= 2) {
      const ultimo = notasBim[idxComDados[idxComDados.length - 1]] as number;
      const penultimo = notasBim[idxComDados[idxComDados.length - 2]] as number;
      tendencia = Number((ultimo - penultimo).toFixed(1));
    }

    return { disc, notasBim, media, tendencia };
  });

  const mediasValidas = tabelaDisciplinas
    .map((d) => d.media)
    .filter((m): m is number => m !== null);

  const mediaGeral =
    mediasValidas.length > 0
      ? mediasValidas.reduce((a, b) => a + b, 0) / mediasValidas.length
      : null;

  const nivelGeral = mediaGeral !== null ? getNivel(mediaGeral) : null;

  // Compute alert status from current bimestre grades (not legacy em_atencao)
  const notasBimestreAtual = notasPorBimestre.find((g) => g.bimestre === bimestreAtual)?.notas ?? [];
  const disciplinasAbaixo5 = disciplinasDaTurma.filter((disc) => {
    const nota = notasBimestreAtual.find(
      (n) => String(n.disciplina_id).trim() === String(disc.id).trim()
    );
    return nota?.nota !== null && nota?.nota !== undefined && Number(nota.nota) < 5;
  }).length;

  const alertaStatus =
    disciplinasAbaixo5 >= 4 ? "critico" :
    disciplinasAbaixo5 >= 2 ? "atencao" :
    "ok";

  const totalBimestresComDados = bimestres.filter((b) =>
    notasPorBimestre.find((g) => g.bimestre === b)?.notas.length
  ).length;

  return (
    <main className="min-h-screen bg-zinc-900 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Back button */}
        <Link
          href={`/dashboard?tab=heatmap${turmaIdParam ? `&turma=${turmaIdParam}` : ""}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao dashboard
        </Link>

        {/* Header card */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
                Nº {String(aluno.numero_chamada).padStart(2, "0")} · {turma?.nome ?? "Turma não identificada"}
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                {aluno.nome}
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Evolução pedagógica · {(escola?.ano_letivo as number | undefined) ?? 2026}
              </p>
            </div>

            {/* KPI chips */}
            <div className="flex flex-wrap gap-3">
              {mediaGeral !== null && (
                <div className="rounded-2xl border border-zinc-700 bg-zinc-900/80 px-5 py-4 text-center">
                  <span className={`text-4xl font-black ${mediaGeral >= 7 ? "text-green-300" : mediaGeral >= 5 ? "text-amber-300" : "text-red-300"}`}>
                    {mediaGeral.toFixed(1)}
                  </span>
                  <p className="text-xs font-semibold text-zinc-500">média geral</p>
                </div>
              )}

              {nivelGeral && (
                <div className={`rounded-2xl border px-5 py-4 text-center ${nivelGeral.cor}`}>
                  <span className="text-sm font-black">{nivelGeral.label}</span>
                  <p className="mt-1 text-xs font-semibold opacity-60">nível</p>
                </div>
              )}

              <div className={`rounded-2xl border px-5 py-4 text-center ${
                disciplinasAbaixo5 === 0
                  ? "border-green-500/30 bg-green-950/20 text-green-300"
                  : disciplinasAbaixo5 < 4
                  ? "border-amber-500/30 bg-amber-950/20 text-amber-300"
                  : "border-red-500/30 bg-red-950/20 text-red-300"
              }`}>
                <span className="text-4xl font-black">{disciplinasAbaixo5}</span>
                <p className="text-xs font-semibold opacity-60">{disciplinasAbaixo5 === 1 ? "disciplina" : "disciplinas"} em risco</p>
              </div>

              <div className={`flex items-center gap-2.5 rounded-2xl border px-5 py-4 ${
                alertaStatus === "critico"
                  ? "border-red-500/30 bg-red-950/20 text-red-300"
                  : alertaStatus === "atencao"
                  ? "border-amber-500/30 bg-amber-950/20 text-amber-300"
                  : "border-green-500/30 bg-green-950/20 text-green-300"
              }`}>
                {alertaStatus === "critico" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : alertaStatus === "atencao" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                <div>
                  <p className="text-sm font-black">
                    {alertaStatus === "critico" ? "Crítico" : alertaStatus === "atencao" ? "Atenção" : "Regular"}
                  </p>
                  <p className="text-xs font-semibold opacity-60">{bimestreAtual}º bimestre</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grades table */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%)]" />

          <div className="relative z-10 mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">Notas por Disciplina</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {turma?.nome} · {totalBimestresComDados} {totalBimestresComDados === 1 ? "bimestre" : "bimestres"} com dados
              </p>
            </div>
          </div>

          <div className="relative z-10 overflow-x-auto rounded-2xl border border-zinc-800 bg-black/20">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[200px] border border-zinc-800 bg-zinc-950 p-3 text-left text-zinc-200">
                    Disciplina
                  </th>
                  {bimestres.map((b) => (
                    <th
                      key={b}
                      className={`min-w-[80px] border border-zinc-800 p-3 text-center font-bold ${
                        b === bimestreAtual
                          ? "bg-indigo-950/40 text-indigo-200"
                          : "bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      {b}º Bim
                      {b === bimestreAtual && (
                        <span className="ml-1 text-[9px] font-normal text-indigo-400/70">(atual)</span>
                      )}
                    </th>
                  ))}
                  <th className="min-w-[80px] border border-zinc-800 bg-zinc-950 p-3 text-center text-zinc-200">
                    Média
                  </th>
                  <th className="min-w-[90px] border border-zinc-800 bg-zinc-950 p-3 text-center text-zinc-400">
                    Tendência
                  </th>
                </tr>
              </thead>

              <tbody>
                {tabelaDisciplinas.map(({ disc, notasBim, media, tendencia }) => (
                  <tr key={disc.id} className="group hover:bg-zinc-900/50">
                    <td className="sticky left-0 z-10 border border-zinc-800 bg-zinc-950 p-3 font-semibold text-zinc-100 group-hover:bg-zinc-900">
                      <span className="mr-2 inline-flex h-5 w-7 items-center justify-center rounded bg-zinc-800 text-[10px] font-black text-zinc-500">
                        {disc.codigo.replace("C", "")}
                      </span>
                      {disc.nome}
                    </td>
                    {notasBim.map((nota, idx) => (
                      <td key={idx} className={`border border-zinc-800 p-2 text-center ${bimestres[idx] === bimestreAtual ? "bg-indigo-950/10" : ""}`}>
                        <div className={`rounded-xl px-2 py-1.5 font-black ring-1 ${getClasseNota(nota, bimestres[idx] === bimestreAtual)}`}>
                          {nota !== null ? nota : "–"}
                        </div>
                      </td>
                    ))}
                    <td className="border border-zinc-800 p-2 text-center">
                      <div className={`rounded-xl px-2 py-1.5 text-base font-black ring-1 ${getClasseNota(media)}`}>
                        {media !== null ? media.toFixed(1) : "–"}
                      </div>
                    </td>
                    <td className="border border-zinc-800 p-2 text-center">
                      {tendencia === null ? (
                        <span className="text-zinc-600">–</span>
                      ) : tendencia > 0 ? (
                        <div className="inline-flex items-center gap-1 rounded-xl bg-green-500/10 px-2 py-1 text-xs font-black text-green-300 ring-1 ring-green-500/20">
                          <TrendingUp className="h-3 w-3" />
                          +{tendencia}
                        </div>
                      ) : tendencia < 0 ? (
                        <div className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 px-2 py-1 text-xs font-black text-red-300 ring-1 ring-red-500/20">
                          <TrendingDown className="h-3 w-3" />
                          {tendencia}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 rounded-xl bg-zinc-800 px-2 py-1 text-xs font-black text-zinc-400 ring-1 ring-zinc-700">
                          <Minus className="h-3 w-3" />
                          0
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            {[
              { cor: "bg-red-500",   texto: "0–4  · Abaixo do Básico" },
              { cor: "bg-amber-500", texto: "5–6  · Básico" },
              { cor: "bg-green-500", texto: "7–8  · Adequado" },
              { cor: "bg-blue-500",  texto: "9–10 · Avançado" },
            ].map(({ cor, texto }) => (
              <div
                key={texto}
                className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-2"
              >
                <div className={`h-3 w-3 rounded-full ${cor}`} />
                <span className="text-xs font-bold text-zinc-300">{texto}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-2">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs font-bold text-zinc-300">Tendência: variação entre os dois últimos bimestres com nota</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
