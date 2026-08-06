import Link from "next/link";
import InfoTooltip from "../InfoTooltip";

type RankingItem = {
  turma: {
    id: string;
    nome: string;
    total_ativos: number;
  };
  media: number;
  totalNotas: number;
};

type Props = {
  ranking: RankingItem[];
  basePath: string;
};

function getMediaColor(media: number): string {
  if (media >= 7) return "var(--status-success-bg)";
  if (media >= 5) return "#E8860C";
  return "var(--status-danger-bg)";
}

function getBarColor(media: number): string {
  if (media >= 7) return "var(--status-success-bg)";
  if (media >= 5) return "var(--status-warning-bg)";
  return "var(--status-danger-bg)";
}

function MediaBar({ media }: { media: number }) {
  const pct = Math.min(100, Math.max(0, (media / 10) * 100));

  return (
    <div
      className="relative mt-3 h-2 w-full overflow-hidden"
      style={{ background: "var(--border-subtle)", borderRadius: "var(--radius-pill)" }}
    >
      <div
        className="absolute left-1/2 top-0 z-10 h-full w-px"
        style={{ background: "var(--text-secondary)", opacity: 0.4 }}
        title="5,0"
      />
      <div
        className="h-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: getBarColor(media),
          borderRadius: "var(--radius-pill)",
        }}
      />
    </div>
  );
}

const medalColors = [
  { bg: "var(--status-warning-tint)", color: "#7A5800", border: "#F2B705" },
  { bg: "var(--bg-app)", color: "var(--text-secondary)", border: "var(--border-subtle)" },
  { bg: "var(--status-danger-tint)", color: "#BF360C", border: "#FF7043" },
];

export default function RankingTurmas({ ranking, basePath }: Props) {
  return (
    <div
      className="p-6 md:p-8"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="mb-6">
        <div
          className="mb-2 inline-flex px-3 py-1 text-xs font-medium"
          style={{
            background: "var(--bg-app)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-pill)",
            color: "var(--text-secondary)",
          }}
        >
          Desempenho por turma
        </div>
        <h2
          className="flex items-center gap-1.5 text-lg tracking-tight"
          style={{ color: "var(--text-primary)", fontWeight: 600 }}
        >
          Ranking de Turmas
          <InfoTooltip
            align="start"
            texto="Turmas ordenadas pela média geral de todas as notas lançadas no recorte selecionado. A linha vertical na barra marca 5,0 — a referência mínima de aprovação por bimestre."
          />
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Classificação por média geral · linha central = 5,0
        </p>
      </div>

      <div className="space-y-3">
        {ranking.map((item, index) => {
          const medal = index < 3 ? medalColors[index] : null;

          return (
            <div
              key={item.turma.id}
              className="p-4 transition"
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                background: index === 0 ? "var(--status-success-tint)" : "var(--bg-app)",
              }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-sm font-semibold"
                    style={{
                      background: medal ? medal.bg : "var(--bg-card)",
                      border: `1px solid ${medal ? medal.border : "var(--border-subtle)"}`,
                      borderRadius: "var(--radius-sm)",
                      color: medal ? medal.color : "var(--text-secondary)",
                    }}
                  >
                    {index + 1}º
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-base tracking-tight"
                      style={{ color: "var(--text-primary)", fontWeight: 600 }}
                    >
                      {item.turma.nome}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <span
                        className="px-2.5 py-0.5 font-medium"
                        style={{
                          borderRadius: "var(--radius-pill)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                          background: "var(--bg-card)",
                        }}
                      >
                        {item.turma.total_ativos} alunos
                      </span>
                      <span
                        className="px-2.5 py-0.5 font-medium"
                        style={{
                          borderRadius: "var(--radius-pill)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                          background: "var(--bg-card)",
                        }}
                      >
                        {item.totalNotas} notas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="px-4 py-2.5 text-center"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-card)",
                    }}
                  >
                    <h2
                      className="text-3xl tracking-tight"
                      style={{ color: getMediaColor(item.media), fontWeight: 600 }}
                    >
                      {item.media.toFixed(1)}
                    </h2>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      média
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`${basePath}?turma=${item.turma.id}&tab=comparativo`}
                      className="px-3 py-1.5 text-center text-xs font-medium transition"
                      style={{
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-secondary)",
                        background: "var(--bg-card)",
                      }}
                    >
                      B1 × B2
                    </Link>
                    <Link
                      href={`${basePath}?turma=${item.turma.id}&tab=heatmap`}
                      className="px-3 py-1.5 text-center text-xs font-medium transition"
                      style={{
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-link)",
                        background: "var(--bg-sidebar-active)",
                      }}
                    >
                      Heatmap
                    </Link>
                  </div>
                </div>
              </div>

              <MediaBar media={item.media} />
            </div>
          );
        })}
      </div>

      {ranking.length === 0 && (
        <div
          className="p-8 text-center text-sm"
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
          }}
        >
          Nenhum dado de ranking encontrado.
        </div>
      )}
    </div>
  );
}
