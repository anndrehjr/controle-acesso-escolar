"use client";

import type { RankingItem } from "../../lib/analytics/buildExecutivo";

type Props = { rankingTurmas: RankingItem[] };

export default function RankingTurmasModal({ rankingTurmas }: Props) {
  const ordenado = [...rankingTurmas].sort((a, b) => (b.media ?? 0) - (a.media ?? 0));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-app)" }}>
              <th className="p-2.5 text-left text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>#</th>
              <th className="p-2.5 text-left text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Turma</th>
              <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Média</th>
              <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Adequado+</th>
              <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Alunos</th>
              <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Evolução no ano</th>
            </tr>
          </thead>
          <tbody>
            {ordenado.map((t, idx) => (
              <tr key={t.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td className="p-2.5" style={{ color: "var(--text-secondary)" }}>{idx + 1}</td>
                <td className="p-2.5 font-medium">{t.nome}</td>
                <td
                  className="p-2.5 text-right font-semibold"
                  style={{ color: (t.media ?? 0) < 5 ? "var(--status-danger-bg)" : (t.media ?? 0) < 7 ? "var(--status-warning-bg)" : "var(--status-success-bg)" }}
                >
                  {t.media?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2.5 text-right" style={{ color: "var(--text-secondary)" }}>
                  {t.percentualAdequado !== null && t.percentualAdequado !== undefined ? `${t.percentualAdequado.toFixed(0)}%` : "—"}
                </td>
                <td className="p-2.5 text-right" style={{ color: "var(--text-secondary)" }}>{t.totalAlunosOuNotas}</td>
                <td
                  className="p-2.5 text-right"
                  style={{ color: t.evolucao === null ? "var(--text-secondary)" : t.evolucao > 0 ? "var(--status-success-bg)" : t.evolucao < 0 ? "var(--status-danger-bg)" : "var(--text-secondary)" }}
                >
                  {t.evolucao === null ? "—" : `${t.evolucao > 0 ? "+" : ""}${t.evolucao.toFixed(1)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
