import { createClient } from "../../../../lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "../../../../lib/analytics/types";

const ESCOLA_ID = process.env.NEXT_PUBLIC_ESCOLA_ID!;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bimestre?: string }>;
};

function getNivel(media: number) {
  if (media < 5) return { label: "Abaixo do Básico", cor: "text-red-300 border-red-900/40 bg-red-950/30" };
  if (media < 7) return { label: "Básico", cor: "text-yellow-300 border-yellow-900/40 bg-yellow-950/30" };
  if (media < 9) return { label: "Adequado", cor: "text-green-300 border-green-900/40 bg-green-950/30" };
  return { label: "Avançado", cor: "text-blue-300 border-blue-900/40 bg-blue-950/30" };
}

function getClasseNota(nota: number | null) {
  if (nota === null) return "bg-zinc-800 text-zinc-500 ring-zinc-700";
  if (nota < 5) return "bg-red-500/15 text-red-300 ring-red-500/30";
  if (nota < 7) return "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30";
  if (nota < 9) return "bg-green-500/15 text-green-300 ring-green-500/30";
  return "bg-blue-500/15 text-blue-300 ring-blue-500/30";
}

async function buscarNotasBimestre(
  supabase: Awaited<ReturnType<typeof createClient>>,
  alunoId: string,
  bimestre: number
): Promise<Nota[]> {
  const { data } = await supabase
    .from("notas")
    .select("*")
    .eq("escola_id", ESCOLA_ID)
    .eq("aluno_id", alunoId)
    .eq("bimestre", bimestre);
  return (data ?? []) as Nota[];
}

export default async function AlunoPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { bimestre: bimestreParam } = await searchParams;
  const supabase = await createClient();

  const [
    { data: alunoRaw },
    { data: escola },
    { data: disciplinas = [] },
    { data: matriz = [] },
  ] = await Promise.all([
    supabase.from("alunos").select("*").eq("id", id).single(),
    supabase.from("escolas").select("*").eq("id", ESCOLA_ID).single(),
    supabase.from("disciplinas").select("*").eq("escola_id", ESCOLA_ID),
    supabase.from("matriz_disciplinas").select("*").eq("escola_id", ESCOLA_ID),
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
  const bimestreAtual = escola?.bimestre_atual ?? 1;
  const bimestres = [1, 2, 3, 4];

  const { data: turmaRaw } = await supabase
    .from("turmas")
    .select("*")
    .eq("id", aluno.turma_id)
    .single();

  const turma = turmaRaw as Turma | null;
  const grupo = turma?.grupo_pedagogico ?? "";

  const matrizDaTurma = (matriz as MatrizDisciplina[])
    .filter(
      (m) =>
        String(m.etapa ?? "").trim().toUpperCase() ===
        String(grupo).trim().toUpperCase()
    )
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
      notas: await buscarNotasBimestre(supabase, aluno.id, b),
    }))
  );

  // Monta tabela: disciplina → { bim1, bim2, bim3, bim4, media }
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

    return { disc, notasBim, media };
  });

  const mediasValidas = tabelaDisciplinas
    .map((d) => d.media)
    .filter((m): m is number => m !== null);

  const mediaGeral =
    mediasValidas.length > 0
      ? mediasValidas.reduce((a, b) => a + b, 0) / mediasValidas.length
      : null;

  const nivelGeral = mediaGeral !== null ? getNivel(mediaGeral) : null;

  return (
    <main className="min-h-screen bg-zinc-900 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao dashboard
          </Link>

          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />

            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
                  Nº {String(aluno.numero_chamada).padStart(2, "0")} · {turma?.nome ?? "Turma não identificada"}
                </div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  {aluno.nome}
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Evolução por disciplina — {escola?.ano_letivo ?? 2026}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {mediaGeral !== null && (
                  <div className="rounded-2xl border border-zinc-700 bg-zinc-900/80 px-5 py-4 text-center">
                    <span className="text-4xl font-black text-white">
                      {mediaGeral.toFixed(1)}
                    </span>
                    <p className="text-xs font-semibold text-zinc-500">média geral</p>
                  </div>
                )}
                {nivelGeral && (
                  <div className={`rounded-2xl border px-5 py-4 text-center ${nivelGeral.cor}`}>
                    <span className="text-sm font-black">{nivelGeral.label}</span>
                  </div>
                )}
                {aluno.em_atencao && (
                  <div className="flex items-center gap-2 rounded-2xl border border-yellow-900/40 bg-yellow-950/30 px-4 py-3 text-yellow-300">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-bold">Atenção</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabela por disciplina */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%)]" />

          <div className="relative z-10 mb-6">
            <h2 className="text-xl font-black tracking-tight">Notas por Disciplina</h2>
            <p className="mt-1 text-sm text-zinc-400">Todos os bimestres · {turma?.nome}</p>
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
                        b === bimestreAtual ? "bg-zinc-800 text-white" : "bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      {b}º Bim
                      {b === bimestreAtual && (
                        <span className="ml-1 text-[10px] font-normal text-zinc-400">(atual)</span>
                      )}
                    </th>
                  ))}
                  <th className="min-w-[90px] border border-zinc-800 bg-zinc-950 p-3 text-center text-zinc-200">
                    Média
                  </th>
                </tr>
              </thead>

              <tbody>
                {tabelaDisciplinas.map(({ disc, notasBim, media }) => (
                  <tr key={disc.id} className="hover:bg-zinc-900/50">
                    <td className="sticky left-0 z-10 border border-zinc-800 bg-zinc-950 p-3 font-semibold text-zinc-100">
                      <span className="mr-2 text-xs font-bold text-zinc-500">
                        {disc.codigo.replace("C", "")}
                      </span>
                      {disc.nome}
                    </td>
                    {notasBim.map((nota, idx) => (
                      <td key={idx} className="border border-zinc-800 p-2 text-center">
                        <div className={`rounded-xl px-2 py-1.5 font-black ring-1 ${getClasseNota(nota)}`}>
                          {nota ?? "-"}
                        </div>
                      </td>
                    ))}
                    <td className="border border-zinc-800 p-2 text-center">
                      <div className={`rounded-xl px-2 py-1.5 text-base font-black ring-1 ${getClasseNota(media)}`}>
                        {media !== null ? media.toFixed(1) : "-"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            {[
              { cor: "bg-red-500", texto: "1-4 Abaixo do Básico" },
              { cor: "bg-yellow-500", texto: "5-6 Básico" },
              { cor: "bg-green-500", texto: "7-8 Adequado" },
              { cor: "bg-blue-500", texto: "9-10 Avançado" },
            ].map(({ cor, texto }) => (
              <div
                key={texto}
                className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-2"
              >
                <div className={`h-4 w-4 rounded ${cor}`} />
                <span className="text-sm font-bold text-zinc-300">{texto}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
