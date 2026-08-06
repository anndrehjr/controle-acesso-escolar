"use client";

import type { RankingItem } from "../../lib/analytics/buildExecutivo";

type Props = {
  fundamental: RankingItem[];
  medio: RankingItem[];
  /** "melhor": top 5 por média (maior primeiro). "critica": bottom 5 (menor primeiro). */
  foco: "melhor" | "critica";
};

function Tabela({ itens, foco }: { itens: RankingItem[]; foco: "melhor" | "critica" }) {
  const ordenados = [...itens].sort((a, b) =>
    foco === "melhor" ? (b.media ?? 0) - (a.media ?? 0) : (a.media ?? 10) - (b.media ?? 10)
  ).slice(0, 5);

  if (ordenados.length === 0) {
    return <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Sem dados suficientes ainda.</p>;
  }

  return (
    <div className="overflow-x-auto" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--bg-app)" }}>
            <th className="p-2.5 text-left text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>#</th>
            <th className="p-2.5 text-left text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Disciplina</th>
            <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Média</th>
            <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Evolução no ano</th>
            <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Vs. bim. anterior</th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((item, idx) => (
            <tr key={item.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <td className="p-2.5" style={{ color: "var(--text-secondary)" }}>{idx + 1}</td>
              <td className="p-2.5 font-medium">{item.nome}</td>
              <td
                className="p-2.5 text-right font-semibold"
                style={{ color: (item.media ?? 0) < 5 ? "var(--status-danger-bg)" : (item.media ?? 0) < 7 ? "var(--status-warning-bg)" : "var(--status-success-bg)" }}
              >
                {item.media?.toFixed(1) ?? "—"}
              </td>
              <td className="p-2.5 text-right" style={{ color: item.evolucao === null ? "var(--text-secondary)" : item.evolucao > 0 ? "var(--status-success-bg)" : item.evolucao < 0 ? "var(--status-danger-bg)" : "var(--text-secondary)" }}>
                {item.evolucao === null ? "—" : `${item.evolucao > 0 ? "+" : ""}${item.evolucao.toFixed(1)}`}
              </td>
              <td className="p-2.5 text-right" style={{ color: item.deltaUltimoBimestre === null ? "var(--text-secondary)" : item.deltaUltimoBimestre > 0 ? "var(--status-success-bg)" : item.deltaUltimoBimestre < 0 ? "var(--status-danger-bg)" : "var(--text-secondary)" }}>
                {item.deltaUltimoBimestre === null ? "—" : `${item.deltaUltimoBimestre > 0 ? "+" : ""}${item.deltaUltimoBimestre.toFixed(1)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RankingDisciplinasModal({ fundamental, medio, foco }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
          Ensino Fundamental
        </p>
        <Tabela itens={fundamental} foco={foco} />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
          Ensino Médio
        </p>
        <Tabela itens={medio} foco={foco} />
      </div>
      <p className="text-xs" style={{ color: "var(--text-secondary)", opacity: 0.8 }}>
        Fundamental e Médio são sempre analisados separadamente, mesmo quando uma disciplina tem o mesmo nome nos dois níveis — os conteúdos e critérios de avaliação são diferentes.
      </p>
    </div>
  );
}
