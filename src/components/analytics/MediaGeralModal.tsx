"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ExecutivoResult } from "../../lib/analytics/buildExecutivo";

type Props = {
  executivo: ExecutivoResult;
};

const statBox: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg-app)",
  padding: "14px 16px",
};

export default function MediaGeralModal({ executivo }: Props) {
  const { snapshots, snapshotAtual, snapshotAnterior, mediaAnualAcumulada } = executivo;
  const dadosGrafico = snapshots.map((s) => ({ label: s.label, media: s.media }));

  const delta =
    snapshotAnterior?.media !== null && snapshotAnterior?.media !== undefined && snapshotAtual.media !== null
      ? Number((snapshotAtual.media - snapshotAnterior.media).toFixed(2))
      : null;
  const percentual =
    delta !== null && snapshotAnterior?.media ? Number(((delta / snapshotAnterior.media) * 100).toFixed(1)) : null;

  // Projeção simples: aplica a média das variações observadas entre bimestres com dados.
  const comDados = snapshots.filter((s) => s.media !== null);
  const deltas = comDados.slice(1).map((s, i) => (s.media as number) - (comDados[i].media as number));
  const deltaMedio = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  const projecao =
    snapshotAtual.media !== null && comDados.length >= 2
      ? Number((snapshotAtual.media + deltaMedio).toFixed(1))
      : null;

  function explicacao(): string {
    if (delta === null) return `Ainda não há bimestre anterior para comparar — este é o primeiro registro do ano.`;
    if (Math.abs(delta) < 0.05) return `A média está estável em relação ao bimestre anterior, sem variação relevante.`;
    if (delta > 0) return `A média subiu ${delta.toFixed(1)} ponto${delta !== 1 ? "s" : ""} (${percentual}%) em relação ao bimestre anterior — indica melhora no desempenho geral.`;
    return `A média caiu ${Math.abs(delta).toFixed(1)} ponto${Math.abs(delta) !== 1 ? "s" : ""} (${percentual}%) em relação ao bimestre anterior — vale investigar as turmas e disciplinas com maior queda.`;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div style={statBox}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{snapshotAtual.label}</p>
          <p className="mt-1 text-2xl font-black">{snapshotAtual.media?.toFixed(1) ?? "—"}</p>
        </div>
        <div style={statBox}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Média anual acumulada</p>
          <p className="mt-1 text-2xl font-black">{mediaAnualAcumulada?.toFixed(1) ?? "—"}</p>
        </div>
        <div style={statBox}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Vs. bimestre anterior</p>
          <p
            className="mt-1 flex items-center gap-1 text-2xl font-black"
            style={{ color: delta === null ? "var(--text-secondary)" : delta > 0 ? "var(--status-success-bg)" : delta < 0 ? "var(--status-danger-bg)" : "var(--text-secondary)" }}
          >
            {delta === null ? "—" : (
              <>
                {delta > 0 ? <TrendingUp className="h-5 w-5" /> : delta < 0 ? <TrendingDown className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                {delta > 0 ? "+" : ""}{delta.toFixed(1)}
              </>
            )}
          </p>
        </div>
        <div style={statBox}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Variação percentual</p>
          <p className="mt-1 text-2xl font-black">{percentual !== null ? `${percentual > 0 ? "+" : ""}${percentual}%` : "—"}</p>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosGrafico} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 12 }}
              formatter={(v) => (typeof v === "number" ? v.toFixed(1) : "sem dados")}
            />
            <Line type="monotone" dataKey="media" stroke="var(--brand-primary)" strokeWidth={3} dot={{ r: 5 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-app)" }}>
              <th className="p-2.5 text-left text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Bimestre</th>
              <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Média</th>
              <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Vs. anterior</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s, idx) => {
              const anterior = idx > 0 ? snapshots[idx - 1] : null;
              const d = s.media !== null && anterior?.media != null ? Number((s.media - anterior.media).toFixed(1)) : null;
              return (
                <tr key={s.bimestre} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td className="p-2.5 font-medium">{s.label}</td>
                  <td className="p-2.5 text-right">{s.media !== null ? s.media.toFixed(1) : "—"}</td>
                  <td className="p-2.5 text-right" style={{ color: d === null ? "var(--text-secondary)" : d > 0 ? "var(--status-success-bg)" : d < 0 ? "var(--status-danger-bg)" : "var(--text-secondary)" }}>
                    {d === null ? "—" : `${d > 0 ? "+" : ""}${d.toFixed(1)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ ...statBox, background: "var(--bg-sidebar-active)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Explicação automática</p>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-primary)" }}>{explicacao()}</p>
        {projecao !== null && (
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Mantido o ritmo observado, a projeção para o próximo bimestre é de aproximadamente <strong style={{ color: "var(--text-primary)" }}>{projecao.toFixed(1)}</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
