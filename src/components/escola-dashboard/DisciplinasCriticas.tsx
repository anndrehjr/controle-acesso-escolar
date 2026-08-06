import InfoTooltip from "../InfoTooltip";

type DisciplinaItem = {
  disciplina: {
    id: string;
    nome: string;
  };
  percentual: number;
  totalCritico: number;
  totalNotas?: number;
};

type Props = {
  geral: DisciplinaItem[];
  fundamental: DisciplinaItem[];
  medio: DisciplinaItem[];
};

function getSeveridade(percentual: number) {
  if (percentual >= 30)
    return {
      label: "Crítico",
      badgeBg: "var(--status-danger-bg)",
      badgeColor: "#FFFFFF",
      barColor: "var(--status-danger-bg)",
    };
  if (percentual >= 20)
    return {
      label: "Alerta",
      badgeBg: "#E8860C",
      badgeColor: "#FFFFFF",
      barColor: "#E8860C",
    };
  if (percentual >= 10)
    return {
      label: "Atenção",
      badgeBg: "var(--status-warning-bg)",
      badgeColor: "var(--text-primary)",
      barColor: "var(--status-warning-bg)",
    };
  return {
    label: "Bom",
    badgeBg: "var(--status-success-bg)",
    badgeColor: "#FFFFFF",
    barColor: "var(--status-success-bg)",
  };
}

function GraficoDisciplinas({
  titulo,
  descricao,
  disciplinas,
}: {
  titulo: string;
  descricao: string;
  disciplinas: DisciplinaItem[];
}) {
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
          Análise curricular
        </div>
        <h2
          className="flex items-center gap-1.5 text-lg tracking-tight"
          style={{ color: "var(--text-primary)", fontWeight: 600 }}
        >
          {titulo}
          <InfoTooltip
            align="start"
            texto="Percentual de notas abaixo de 5,0 sobre o total de notas lançadas na disciplina, neste recorte. Faixas: Bom < 10%, Atenção 10-19%, Alerta 20-29%, Crítico ≥ 30%."
          />
        </h2>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {descricao}
        </p>
      </div>

      <div className="space-y-4">
        {disciplinas.map((item, index) => {
          const percentual = Math.round(item.percentual);
          const severidade = getSeveridade(percentual);

          return (
            <div
              key={item.disciplina.id}
              className="p-4"
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-app)",
              }}
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center text-xs font-medium"
                  style={{
                    background: "var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {index + 1}
                </span>

                <span
                  className="min-w-0 flex-1 truncate text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.disciplina.nome}
                </span>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      borderRadius: "var(--radius-pill)",
                      background: severidade.badgeBg,
                      color: severidade.badgeColor,
                    }}
                  >
                    {severidade.label}
                  </span>
                  <span
                    className="px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      borderRadius: "var(--radius-pill)",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {percentual}%
                  </span>
                </div>
              </div>

              <div
                className="h-3 w-full overflow-hidden"
                style={{ background: "var(--border-subtle)", borderRadius: "var(--radius-pill)" }}
              >
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${percentual}%`,
                    background: severidade.barColor,
                    borderRadius: "var(--radius-pill)",
                  }}
                />
              </div>

              <div
                className="mt-2 flex flex-wrap gap-3 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                <span style={{ color: "var(--text-primary)", fontWeight: "var(--font-weight-medium)" }}>
                  {item.totalCritico} abaixo de 5,0
                </span>
                {item.totalNotas !== undefined && <span>de {item.totalNotas} notas</span>}
              </div>
            </div>
          );
        })}
      </div>

      {disciplinas.length === 0 && (
        <div
          className="p-8 text-center text-sm"
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
          }}
        >
          Nenhum dado encontrado para esta etapa.
        </div>
      )}
    </div>
  );
}

export default function DisciplinasCriticas({ geral, fundamental, medio }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <GraficoDisciplinas
          titulo="Ensino Fundamental"
          descricao="Notas abaixo do básico apenas das turmas do Fundamental."
          disciplinas={fundamental}
        />
        <GraficoDisciplinas
          titulo="Ensino Médio"
          descricao="Notas abaixo do básico apenas das turmas do Médio."
          disciplinas={medio}
        />
      </div>
      <GraficoDisciplinas
        titulo="Componentes Curriculares Críticos — Geral"
        descricao="Percentual geral de notas abaixo do básico por disciplina."
        disciplinas={geral}
      />
    </div>
  );
}
