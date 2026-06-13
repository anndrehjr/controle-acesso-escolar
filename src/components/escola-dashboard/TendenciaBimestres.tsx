"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useCurrentTheme } from "../../hooks/useCurrentTheme";

type PontoTendencia = {
  bimestre: number;
  label: string;
  media: number | null;
  totalNotas: number;
  alunosCriticos: number;
  percentualAdequado: number | null;
  temDados: boolean;
};

type TendenciaData = {
  turma: { id: string; nome: string } | null;
  pontos: PontoTendencia[];
};

type Props = {
  turmaId?: string | null;
};

function corPorMedia(media: number): string {
  if (media < 5) return "#ef4444";
  if (media < 7) return "#eab308";
  if (media < 9) return "#22c55e";
  return "#3b82f6";
}

function DotCustom(props: {
  cx?: number;
  cy?: number;
  payload?: PontoTendencia;
  index?: number;
}) {
  const { cx, cy, payload } = props;
  if (!payload?.temDados || payload.media === null || cx == null || cy == null) {
    return <g />;
  }
  const cor = corPorMedia(payload.media);
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={cor} stroke="#09090b" strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={14} fill={cor} fillOpacity={0.12} stroke="none" />
    </g>
  );
}

function TooltipCustom(props: {
  active?: boolean;
  payload?: { payload: PontoTendencia }[];
}) {
  const { active, payload } = props;
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  if (!d.temDados || d.media === null) return null;

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {d.label}
      </p>
      <p className="mt-1 text-3xl font-black" style={{ color: corPorMedia(d.media) }}>
        {d.media.toFixed(1)}
      </p>
      <p className="mt-1 text-sm text-zinc-400">{d.totalNotas} notas</p>
      {d.alunosCriticos > 0 && (
        <p className="mt-0.5 text-xs text-red-400">{d.alunosCriticos} críticos</p>
      )}
    </div>
  );
}

export default function TendenciaBimestres({ turmaId }: Props) {
  const [data, setData] = useState<TendenciaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const theme = useCurrentTheme();
  const chartC = theme === "light"
    ? { grid: "#e5e7eb", tick: "#6b7280", tickMuted: "#9ca3af", line: "#111827" }
    : { grid: "#27272a", tick: "#71717a", tickMuted: "#52525b", line: "#ffffff" };

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);
        const params = new URLSearchParams();
        if (turmaId) params.set("turma", turmaId);
        const res = await fetch(`/api/dashboard/tendencia?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erro ao carregar tendência");
        setData(json);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro inesperado");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [turmaId, refreshKey]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-28 rounded-full bg-zinc-800" />
            <div className="h-8 w-72 rounded-2xl bg-zinc-800" />
            <div className="h-4 w-80 rounded-xl bg-zinc-800/60" />
          </div>
          <div className="h-64 rounded-2xl bg-zinc-800/40" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-zinc-800/40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-3xl border border-red-900 bg-red-950/30 p-8 shadow-2xl backdrop-blur">
        <p className="text-red-300">Erro ao carregar tendência: {erro}</p>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="mt-4 rounded-2xl border border-red-700 bg-red-900/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-900/60"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { pontos } = data;
  const pontosComDados = pontos.filter((p) => p.temDados && p.media !== null);
  const temTendencia = pontosComDados.length >= 2;

  const primeiro = pontosComDados[0];
  const ultimo = pontosComDados[pontosComDados.length - 1];
  const delta =
    primeiro && ultimo && primeiro !== ultimo && primeiro.media !== null && ultimo.media !== null
      ? ultimo.media - primeiro.media
      : null;

  const escopo = data.turma ? `Turma ${data.turma.nome}` : "Escola — todas as turmas";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
            Evolução anual
          </div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            Tendência dos Bimestres
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-base">
            {escopo} — evolução da média geral ao longo do ano.
          </p>
        </div>

        {delta !== null && (
          <div
            className={`shrink-0 rounded-2xl border px-5 py-4 text-center ${
              delta >= 0
                ? "border-green-900/50 bg-green-950/30"
                : "border-red-900/50 bg-red-950/30"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              {delta >= 0 ? (
                <ArrowUp className="h-5 w-5 text-green-400" />
              ) : (
                <ArrowDown className="h-5 w-5 text-red-400" />
              )}
              <span
                className={`text-3xl font-black ${
                  delta >= 0 ? "text-green-300" : "text-red-300"
                }`}
              >
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(1)}
              </span>
            </div>
            <p className={`mt-1 text-xs font-semibold ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
              {primeiro?.label} → {ultimo?.label}
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative z-10">
        {!temTendencia ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 text-sm text-zinc-500">
            Dados insuficientes para exibir tendência (mínimo 2 bimestres com notas).
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={pontos}
              margin={{ top: 16, right: 48, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartC.grid}
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fill: chartC.tick, fontSize: 13, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                domain={[0, 10]}
                ticks={[0, 2, 4, 5, 6, 7, 8, 10]}
                tick={{ fill: chartC.tickMuted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <ReferenceLine
                y={5}
                stroke="#ef4444"
                strokeDasharray="5 4"
                strokeOpacity={0.5}
                label={{
                  value: "5,0 básico",
                  position: "right",
                  fill: "#ef4444",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />

              <ReferenceLine
                y={7}
                stroke="#22c55e"
                strokeDasharray="5 4"
                strokeOpacity={0.5}
                label={{
                  value: "7,0 adequado",
                  position: "right",
                  fill: "#22c55e",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />

              <Tooltip
                content={(props) => (
                  <TooltipCustom
                    active={props.active}
                    payload={
                      props.payload as unknown as { payload: PontoTendencia }[] | undefined
                    }
                  />
                )}
                cursor={{ stroke: "#3f3f46", strokeWidth: 1 }}
              />

              <Line
                type="monotone"
                dataKey="media"
                stroke={chartC.line}
                strokeWidth={3}
                dot={(props) => (
                  <DotCustom
                    key={`dot-${props.index}`}
                    cx={props.cx}
                    cy={props.cy}
                    payload={props.payload as PontoTendencia}
                    index={props.index}
                  />
                )}
                activeDot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-bimestre stats row */}
      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {pontos.map((p, idx) => {
          const anterior = pontos
            .slice(0, idx)
            .reverse()
            .find((q) => q.temDados && q.media !== null);
          const delta =
            p.temDados && p.media !== null && anterior?.media != null
              ? p.media - anterior.media
              : null;

          return (
            <div
              key={p.bimestre}
              className={`rounded-2xl border p-4 transition ${
                p.temDados
                  ? "border-zinc-700 bg-zinc-900/70"
                  : "border-zinc-800/50 bg-zinc-900/20"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {p.label}
              </p>

              <p
                className="mt-2 text-3xl font-black"
                style={{
                  color:
                    p.temDados && p.media !== null
                      ? corPorMedia(p.media)
                      : "#3f3f46",
                }}
              >
                {p.temDados && p.media !== null ? p.media.toFixed(1) : "—"}
              </p>

              <div className="mt-2 flex items-center justify-between gap-2">
                {p.temDados ? (
                  <p className="text-xs text-zinc-600">{p.totalNotas} notas</p>
                ) : (
                  <p className="text-xs text-zinc-700">sem dados</p>
                )}

                {delta !== null && (
                  <span
                    className={`flex items-center gap-0.5 text-xs font-black ${
                      delta >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {delta >= 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {Math.abs(delta).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="relative z-10 mt-5 flex flex-wrap gap-3">
        {[
          { cor: "#ef4444", texto: "< 5,0 Abaixo do Básico" },
          { cor: "#eab308", texto: "5,0–6,9 Básico" },
          { cor: "#22c55e", texto: "7,0–8,9 Adequado" },
          { cor: "#3b82f6", texto: "≥ 9,0 Avançado" },
        ].map(({ cor, texto }) => (
          <div
            key={texto}
            className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-3 py-1.5"
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: cor }}
            />
            <span className="text-xs font-semibold text-zinc-400">{texto}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
