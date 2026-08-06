"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import InfoTooltip from "../InfoTooltip";
import StyledSelect from "../StyledSelect";

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
    /** 3+ disciplinas em risco pela média acumulada do ano (mesma regra do dashboard/alertas) */
    preReprovado?: boolean;
    disciplinas: {
      disciplinaId: string;
      disciplinaNome: string;
      codigo: string;
      nota: number | null;
    }[];
  }[];
};

function getStyleNota(nota: number | null): React.CSSProperties {
  if (nota === null)
    return { background: "var(--border-subtle)", color: "var(--text-secondary)" };
  if (nota <= 4)
    return { background: "var(--status-danger-tint)", color: "var(--status-danger-bg)" };
  if (nota <= 6)
    return { background: "var(--status-warning-tint)", color: "var(--status-warning-bg)" };
  if (nota <= 8)
    return { background: "var(--status-success-tint)", color: "var(--status-success-bg)" };
  return { background: "rgba(91,156,246,0.18)", color: "var(--brand-primary)" };
}

type Props = {
  bimestre: number;
  turmaId?: string | null;
  escolaId?: string;
};

export default function HeatmapPedagogico({ bimestre, turmaId, escolaId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [mostrarNomes, setMostrarNomes] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function carregarHeatmap() {
      try {
        setLoading(true);
        setErro(null);

        const params = new URLSearchParams({ bimestre: String(bimestre) });
        if (turmaId) params.set("turma", turmaId);
        if (escolaId) params.set("escolaId", escolaId);
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
  }, [bimestre, turmaId, escolaId, refreshKey]);

  const turmaAtual = data.find((t) => t.turmaId === turmaSelecionada) ?? data[0];

  if (loading) {
    return (
      <div
        className="relative overflow-hidden rounded-3xl border p-6 shadow-2xl backdrop-blur md:p-8"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)" }}
      >
        <div className="animate-pulse space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-32 rounded-full" style={{ background: "var(--border-subtle)" }} />
            <div className="h-8 w-64 rounded-2xl" style={{ background: "var(--border-subtle)" }} />
            <div className="h-4 w-80 rounded-xl" style={{ background: "var(--border-subtle)" }} />
          </div>
          <div className="h-10 w-48 rounded-2xl" style={{ background: "var(--border-subtle)" }} />
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-subtle)" }}>
            <div
              className="h-10 border-b"
              style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)" }}
            />
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex h-12 gap-2 border-b px-3 items-center"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div className="h-4 w-40 rounded" style={{ background: "var(--border-subtle)" }} />
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="flex-1">
                    <div className="mx-auto h-7 w-full rounded-xl" style={{ background: "var(--border-subtle)" }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-3xl border border-red-900 bg-red-950/30 p-8 shadow-2xl backdrop-blur">
        <p className="text-red-300">Erro ao carregar heatmap: {erro}</p>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="mt-4 rounded-2xl border border-red-700 bg-red-900/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-900/60"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!turmaAtual) {
    return (
      <div
        className="rounded-3xl border p-8 shadow-2xl backdrop-blur"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--bg-app)",
          color: "var(--text-secondary)",
        }}
      >
        Nenhum dado de heatmap disponivel.
      </div>
    );
  }

  const alunosOrdenados = [...turmaAtual.alunos].sort((a, b) =>
    mostrarNomes
      ? a.nome.localeCompare(b.nome)
      : a.numeroChamada - b.numeroChamada
  );

  return (
    <div
      className="relative overflow-hidden rounded-3xl border p-6 shadow-2xl backdrop-blur md:p-8"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: "var(--border-subtle)" }} />

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div
            className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--bg-app)",
              color: "var(--text-secondary)",
            }}
          >
            Mapa de desempenho
          </div>
          <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight md:text-3xl">
            Heatmap Pedagogico
            <InfoTooltip
              align="start"
              texto="Cada célula é a nota de um aluno numa disciplina, no bimestre selecionado. A cor segue a faixa de desempenho (veja a legenda abaixo). Células vazias indicam nota ainda não lançada."
            />
          </h2>
          <p
            className="mt-2 text-sm leading-relaxed md:text-base"
            style={{ color: "var(--text-secondary)" }}
          >
            Notas por aluno e disciplina. Clique no aluno para ver o detalhamento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMostrarNomes((v) => !v)}
            className="flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--bg-app)",
              color: "var(--text-secondary)",
            }}
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

          <StyledSelect
            value={turmaAtual.turmaId}
            onChange={(e) => setTurmaSelecionada(e.target.value)}
            className="rounded-2xl py-3 pl-4 text-sm font-bold"
          >
            {data.map((turma) => (
              <option key={turma.turmaId} value={turma.turmaId}>
                {turma.turmaNome}
              </option>
            ))}
          </StyledSelect>
        </div>
      </div>

      <div
        className="relative z-10 mt-8 overflow-x-auto rounded-2xl border"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)" }}
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-20 min-w-[220px] border p-3 text-left"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--bg-app)",
                  color: "var(--text-primary)",
                }}
              >
                Aluno
              </th>
              {turmaAtual.disciplinas.map((d) => (
                <th
                  key={d.id}
                  title={d.nome}
                  className="min-w-[72px] border p-3 text-center"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--bg-app)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {d.codigo.replace("C", "")}
                </th>
              ))}
              <th
                className="min-w-[100px] border p-3 text-center"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--bg-app)",
                  color: "var(--text-primary)",
                }}
              >
                Media
              </th>
            </tr>
          </thead>

          <tbody>
            {alunosOrdenados.map((aluno) => (
              <tr
                key={aluno.alunoId}
                onClick={() => router.push(`/dashboard/aluno/${aluno.alunoId}?turmaId=${turmaSelecionada}`)}
                className={`cursor-pointer ${
                  aluno.emAtencao
                    ? "bg-red-500/5 hover:bg-red-500/10"
                    : "hover:bg-zinc-800/20"
                }`}
              >
                <td
                  className="sticky left-0 z-10 border p-3 font-semibold"
                  style={
                    aluno.emAtencao
                      ? { borderColor: "var(--border-subtle)" }
                      : {
                          borderColor: "var(--border-subtle)",
                          background: "var(--bg-app)",
                          color: "var(--text-primary)",
                        }
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className={aluno.emAtencao ? "text-red-400" : undefined}>
                      {mostrarNomes
                        ? aluno.nome
                        : `N ${String(aluno.numeroChamada).padStart(2, "0")}`}
                    </span>
                    {aluno.preReprovado && (
                      <span
                        title="Pré-Reprovado: 3 ou mais disciplinas em risco pela média acumulada do ano"
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ background: "var(--status-danger-bg)", color: "#FFFFFF" }}
                      >
                        PR
                      </span>
                    )}
                  </span>
                </td>
                {aluno.disciplinas.map((d) => (
                  <td
                    key={d.disciplinaId}
                    className="border p-2 text-center"
                    style={{ borderColor: "var(--border-subtle)" }}
                    title={d.disciplinaNome}
                  >
                    <div
                      className="rounded-xl px-2 py-1.5 font-black"
                      style={getStyleNota(d.nota)}
                    >
                      {d.nota ?? "-"}
                    </div>
                  </td>
                ))}
                <td
                  className="border p-2 text-center"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div
                    className="rounded-xl px-2 py-1.5 text-base font-black"
                    style={getStyleNota(aluno.media)}
                  >
                    {aluno.media !== null ? aluno.media.toFixed(1) : "-"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap gap-3">
        <Legenda cor="bg-red-500" texto="1-4 Abaixo do Basico" />
        <Legenda cor="bg-yellow-500" texto="5-6 Basico" />
        <Legenda cor="bg-green-500" texto="7-8 Adequado" />
        <Legenda cor="bg-blue-500" texto="9-10 Avancado" />
      </div>

      <div
        className="relative z-10 mt-5 rounded-2xl border p-5"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--bg-app)",
        }}
      >
        <p className="font-bold" style={{ color: "var(--text-primary)" }}>
          Legenda - {turmaAtual.turmaNome}:
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {turmaAtual.disciplinas.map((d) => (
            <span
              key={d.id}
              className="rounded-xl border px-3 py-1.5 text-sm"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>{d.codigo.replace("C", "")}:</strong>{" "}
              {d.nome}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-2xl border px-4 py-2 shadow-lg"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--bg-app)",
      }}
    >
      <div className={`h-4 w-4 rounded ${cor}`} />
      <span className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
        {texto}
      </span>
    </div>
  );
}