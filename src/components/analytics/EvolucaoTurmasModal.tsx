"use client";

import type { RankingItem } from "../../lib/analytics/buildExecutivo";

type Props = { rankingTurmas: RankingItem[] };

function Lista({ itens, cor }: { itens: RankingItem[]; cor: string }) {
  if (itens.length === 0) {
    return <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Sem dados suficientes ainda.</p>;
  }
  return (
    <ul className="space-y-2">
      {itens.map((t, idx) => (
        <li
          key={t.id}
          className="flex items-center gap-3 px-4 py-3"
          style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--bg-app)" }}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
            style={{ background: `color-mix(in srgb, ${cor} 15%, transparent)`, color: cor }}
          >
            {idx + 1}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{t.nome}</span>
          <span className="text-right text-xs" style={{ color: "var(--text-secondary)" }}>
            {t.deltaUltimoBimestre !== null ? `${t.deltaUltimoBimestre > 0 ? "+" : ""}${t.deltaUltimoBimestre.toFixed(1)} vs bim. anterior` : ""}
          </span>
          <span className="shrink-0 text-lg font-black" style={{ color: cor }}>
            {t.evolucao !== null ? `${t.evolucao > 0 ? "+" : ""}${t.evolucao.toFixed(1)}` : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function EvolucaoTurmasModal({ rankingTurmas }: Props) {
  const comEvolucao = rankingTurmas.filter((t) => t.evolucao !== null);
  const maisEvoluiram = [...comEvolucao].sort((a, b) => (b.evolucao as number) - (a.evolucao as number)).slice(0, 5);
  const maisCairam = [...comEvolucao]
    .sort((a, b) => (a.evolucao as number) - (b.evolucao as number))
    .slice(0, 5)
    .filter((t) => (t.evolucao as number) < 0);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--status-success-bg)" }}>
          Mais evoluíram no ano
        </p>
        <Lista itens={maisEvoluiram} cor="var(--status-success-bg)" />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--status-danger-bg)" }}>
          Mais caíram no ano
        </p>
        <Lista itens={maisCairam} cor="var(--status-danger-bg)" />
      </div>
      {comEvolucao.length === 0 && (
        <p className="text-sm md:col-span-2" style={{ color: "var(--text-secondary)" }}>
          A evolução das turmas aparece a partir do 2º bimestre com notas lançadas.
        </p>
      )}
    </div>
  );
}
