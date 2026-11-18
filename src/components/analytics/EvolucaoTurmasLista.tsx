type TurmaEvolucao = {
  turma: { id: string; nome: string };
  media: number | null;
  mediaAnterior: number | null;
  delta: number | null;
  temDados: boolean;
};

type Props = {
  turmas: TurmaEvolucao[];
  bimestreAtual: number;
};

function corMedia(m: number | null) {
  if (m === null) return "var(--text-secondary)";
  if (m < 5) return "#ef4444";
  if (m < 7) return "#eab308";
  if (m < 8) return "#22c55e";
  return "#3b82f6";
}

export default function EvolucaoTurmasLista({ turmas, bimestreAtual }: Props) {
  const temAnterior = bimestreAtual > 1;

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="mb-5">
        <div
          className="mb-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)", color: "var(--text-secondary)" }}
        >
          Desempenho por turma
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Evolucao por Turma
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Media do {bimestreAtual}o bimestre{temAnterior ? ` vs ${bimestreAtual - 1}o bimestre` : ""}
        </p>
      </div>

      <div className="space-y-3">
        {turmas.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: "var(--text-secondary)" }}>
            Nenhuma turma com dados no {bimestreAtual}o bimestre.
          </p>
        )}
        {turmas.map((t) => {
          const barWidth = t.media !== null ? Math.min(100, (t.media / 10) * 100) : 0;
          const deltaIcon = t.delta === null ? null : t.delta > 0 ? "+" : t.delta < 0 ? "" : "";
          const deltaCor = t.delta === null ? "var(--text-secondary)"
            : t.delta > 0 ? "#22c55e"
            : t.delta < 0 ? "#ef4444"
            : "#eab308";

          return (
            <div
              key={t.turma.id}
              className="flex items-center gap-4 rounded-xl border p-4"
              style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)" }}
            >
              <div className="w-20 shrink-0">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t.turma.nome}</p>
              </div>

              <div className="flex-1">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${barWidth}%`, background: corMedia(t.media) }}
                  />
                </div>
              </div>

              <div className="w-12 text-right shrink-0">
                <span className="text-lg font-black" style={{ color: corMedia(t.media) }}>
                  {t.media !== null ? t.media.toFixed(1) : "-"}
                </span>
              </div>

              {temAnterior && (
                <div className="w-16 text-right shrink-0">
                  {t.delta !== null ? (
                    <span className="text-sm font-bold" style={{ color: deltaCor }}>
                      {deltaIcon}{t.delta.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--border-subtle)" }}>-</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
