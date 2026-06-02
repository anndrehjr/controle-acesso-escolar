"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

type HeatmapData = {
  turmaId: string;
  turmaNome: string;
  grupoPedagogico?: string;
  disciplinas: {
    id: string;
    nome: string;
    codigo: string;
  }[];
  alunos: {
    alunoId: string;
    nome: string;
    numeroChamada: number;
    emAtencao: boolean;
    media: number | null;
    disciplinas: {
      disciplinaId: string;
      disciplinaNome: string;
      codigo: string;
      nota: number | null;
    }[];
  }[];
};

function getClasseNota(nota: number | null) {
  if (nota === null) return "bg-zinc-800 text-zinc-500 ring-zinc-700";
  if (nota <= 4) return "bg-red-500/15 text-red-300 ring-red-500/30";
  if (nota <= 6) return "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30";
  if (nota <= 8) return "bg-green-500/15 text-green-300 ring-green-500/30";
  return "bg-blue-500/15 text-blue-300 ring-blue-500/30";
}

type Props = {
  bimestre: number;
  turmaId?: string | null;
};

export default function HeatmapPedagogico({ bimestre, turmaId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [mostrarNomes, setMostrarNomes] = useState(true);

  useEffect(() => {
    async function carregarHeatmap() {
      try {
        setLoading(true);
        setErro(null);

        const params = new URLSearchParams({ bimestre: String(bimestre) });
        if (turmaId) params.set("turma", turmaId);
        const response = await fetch(`/api/dashboard/heatmap?${params.toString()}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error ?? "Erro ao carregar heatmap");
        }

        setData(json.data ?? []);

        if (json.data?.[0]?.turmaId) {
          setTurmaSelecionada(json.data[0].turmaId);
        }
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro inesperado ao carregar heatmap");
      } finally {
        setLoading(false);
      }
    }

    carregarHeatmap();
  }, [bimestre, turmaId]);

  const turmaAtual = data.find((t) => t.turmaId === turmaSelecionada) ?? data[0];

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-zinc-400 shadow-2xl backdrop-blur">
        Carregando heatmap pedagógico...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-3xl border border-red-900 bg-red-950/30 p-8 text-red-300 shadow-2xl backdrop-blur">
        Erro ao carregar heatmap: {erro}
      </div>
    );
  }

  if (!turmaAtual) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-zinc-400 shadow-2xl backdrop-blur">
        Nenhum dado de heatmap disponível.
      </div>
    );
  }

  const alunosOrdenados = [...turmaAtual.alunos].sort((a, b) =>
    mostrarNomes
      ? a.nome.localeCompare(b.nome)
      : a.numeroChamada - b.numeroChamada
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
            Mapa de desempenho
          </div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            Heatmap Pedagógico
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-base">
            Notas por aluno e disciplina. Clique no aluno para ver o detalhamento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMostrarNomes((v) => !v)}
            className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            {mostrarNomes ? (
              <>
                <EyeOff className="h-4 w-4" />
                Ocultar nomes
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Mostrar nomes
              </>
            )}
          </button>

          <select
            value={turmaAtual.turmaId}
            onChange={(e) => setTurmaSelecionada(e.target.value)}
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-white"
          >
            {data.map((turma) => (
              <option key={turma.turmaId} value={turma.turmaId}>
                {turma.turmaNome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative z-10 mt-8 overflow-x-auto rounded-2xl border border-zinc-800 bg-black/20">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-[220px] border border-zinc-800 bg-zinc-950 p-3 text-left text-zinc-200">
                Aluno
              </th>
              {turmaAtual.disciplinas.map((d) => (
                <th
                  key={d.id}
                  title={d.nome}
                  className="min-w-[72px] border border-zinc-800 bg-zinc-950 p-3 text-center text-zinc-300"
                >
                  {d.codigo.replace("C", "")}
                </th>
              ))}
              <th className="min-w-[100px] border border-zinc-800 bg-zinc-950 p-3 text-center text-zinc-200">
                Média
              </th>
            </tr>
          </thead>

          <tbody>
            {alunosOrdenados.map((aluno) => (
              <tr
                key={aluno.alunoId}
                onClick={() => router.push(`/dashboard/aluno/${aluno.alunoId}`)}
                className={`cursor-pointer ${
                  aluno.emAtencao
                    ? "bg-red-500/5 hover:bg-red-500/10"
                    : "hover:bg-zinc-800/60"
                }`}
              >
                <td
                  className={`sticky left-0 z-10 border border-zinc-800 p-3 font-semibold ${
                    aluno.emAtencao
                      ? "bg-red-950/80 text-red-300"
                      : "bg-zinc-950 text-zinc-100"
                  }`}
                >
                  {mostrarNomes
                    ? aluno.nome
                    : `Nº ${String(aluno.numeroChamada).padStart(2, "0")}`}
                </td>
                {aluno.disciplinas.map((d) => (
                  <td
                    key={d.disciplinaId}
                    className="border border-zinc-800 p-2 text-center"
                    title={d.disciplinaNome}
                  >
                    <div className={`rounded-xl px-2 py-1.5 font-black ring-1 ${getClasseNota(d.nota)}`}>
                      {d.nota ?? "-"}
                    </div>
                  </td>
                ))}
                <td className="border border-zinc-800 p-2 text-center">
                  <div className={`rounded-xl px-2 py-1.5 text-base font-black ring-1 ${getClasseNota(aluno.media)}`}>
                    {aluno.media !== null ? aluno.media.toFixed(1) : "-"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap gap-3">
        <Legenda cor="bg-red-500" texto="1-4 Abaixo do Básico" />
        <Legenda cor="bg-yellow-500" texto="5-6 Básico" />
        <Legenda cor="bg-green-500" texto="7-8 Adequado" />
        <Legenda cor="bg-blue-500" texto="9-10 Avançado" />
      </div>

      <div className="relative z-10 mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="font-bold text-zinc-200">
          Legenda — {turmaAtual.turmaNome}:
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {turmaAtual.disciplinas.map((d) => (
            <span
              key={d.id}
              className="rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-1.5 text-sm text-zinc-300"
            >
              <strong className="text-white">{d.codigo.replace("C", "")}:</strong> {d.nome}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-2 shadow-lg">
      <div className={`h-4 w-4 rounded ${cor}`} />
      <span className="text-sm font-bold text-zinc-300">{texto}</span>
    </div>
  );
}
