import Link from "next/link";

type Turma = {
  id: string;
  nome: string;
  total_ativos: number;
  media?: number | null;
};

type Props = {
  turmas: Turma[];
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

function StatusBar({ media }: { media: number }) {
  const pct = Math.min(100, Math.max(0, (media / 10) * 100));

  return (
    <div
      className="relative mt-2 h-1.5 w-full overflow-hidden"
      style={{ background: "var(--border-subtle)", borderRadius: "var(--radius-pill)" }}
    >
      <div
        className="absolute left-1/2 top-0 z-10 h-full w-px"
        style={{ background: "var(--text-secondary)", opacity: 0.4 }}
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

const itemCardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "var(--shadow-card)",
  padding: "var(--space-3)",
  display: "block",
};

export default function ListaTurmas({ turmas }: Props) {
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
          Organização escolar
        </div>
        <h2
          className="text-lg tracking-tight"
          style={{ color: "var(--text-primary)", fontWeight: 600 }}
        >
          Turmas da Escola
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Relação de turmas ativas e quantidade de alunos.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {turmas.map((turma) => {
          return (
            <Link
              key={turma.id}
              href={`/dashboard?turma=${turma.id}&tab=heatmap`}
              className="group block transition"
              style={itemCardStyle}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="text-sm leading-tight"
                  style={{ color: "var(--text-primary)", fontWeight: 600 }}
                >
                  {turma.nome}
                </span>

                {turma.media != null ? (
                  <span
                    className="shrink-0 text-xl"
                    style={{ color: getMediaColor(turma.media), fontWeight: 600 }}
                  >
                    {turma.media.toFixed(1)}
                  </span>
                ) : (
                  <span
                    className="shrink-0 px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-pill)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {turma.total_ativos} alunos
                  </span>
                )}
              </div>

              {turma.media != null && (
                <>
                  <p className="mt-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {turma.total_ativos} alunos
                  </p>
                  <StatusBar media={turma.media} />
                </>
              )}

              <p
                className="mt-2.5 text-xs font-medium"
                style={{ color: "var(--text-link)" }}
              >
                Ver heatmap →
              </p>
            </Link>
          );
        })}
      </div>

      {turmas.length === 0 && (
        <div
          className="p-8 text-center text-sm"
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
          }}
        >
          Nenhuma turma encontrada.
        </div>
      )}
    </div>
  );
}
