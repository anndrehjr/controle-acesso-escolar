type BimEntry = { bimestre: number; media: number | null; temDados: boolean };
type DisciplinaRow = {
  disciplina: { id: string; nome: string };
  bims: BimEntry[];
  evolucao: number | null;
};

type Props = {
  disciplinasFundamental: DisciplinaRow[];
  disciplinasMedio: DisciplinaRow[];
  bimestreAtual: number;
};

function corMedia(m: number | null) {
  if (m === null) return "var(--text-secondary)";
  if (m < 5) return "#ef4444";
  if (m < 7) return "#eab308";
  if (m < 9) return "#22c55e";
  return "#3b82f6";
}

function SubTabela({ titulo, disciplinas, bimestreAtual }: { titulo: string; disciplinas: DisciplinaRow[]; bimestreAtual: number }) {
  if (disciplinas.length === 0) {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--brand-primary)" }}>{titulo}</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Sem dados ainda.</p>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--brand-primary)" }}>{titulo}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-widest pr-4" style={{ color: "var(--text-secondary)" }}>
                Disciplina
              </th>
              {[1, 2, 3, 4].map((b) => (
                <th
                  key={b}
                  className="pb-3 text-center text-xs font-semibold uppercase tracking-widest px-2"
                  style={{ color: b === bimestreAtual ? "var(--brand-primary)" : "var(--text-secondary)" }}
                >
                  {b}º Bim
                </th>
              ))}
              <th className="pb-3 text-center text-xs font-semibold uppercase tracking-widest px-2" style={{ color: "var(--text-secondary)" }}>
                Evolução
              </th>
            </tr>
          </thead>
          <tbody>
            {disciplinas.map((row) => (
              <tr key={row.disciplina.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td className="py-3 pr-4 font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                  {row.disciplina.nome}
                </td>
                {row.bims.map((b) => (
                  <td key={b.bimestre} className="py-3 px-2 text-center">
                    {b.temDados && b.media !== null ? (
                      <span
                        className="inline-block rounded-lg px-2 py-1 text-xs font-bold"
                        style={{ color: corMedia(b.media), background: corMedia(b.media) + "22" }}
                      >
                        {b.media.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--border-subtle)" }}>-</span>
                    )}
                  </td>
                ))}
                <td className="py-3 px-2 text-center">
                  {row.evolucao !== null ? (
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-bold"
                      style={{ color: row.evolucao >= 0 ? "#22c55e" : "#ef4444", background: (row.evolucao >= 0 ? "#22c55e" : "#ef4444") + "22" }}
                    >
                      {row.evolucao >= 0 ? "+" : ""}{row.evolucao.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--border-subtle)" }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TabelaComparativa({ disciplinasFundamental, disciplinasMedio, bimestreAtual }: Props) {
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
          Comparativo anual
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Desempenho por Disciplina
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Média de cada disciplina por bimestre — Fundamental e Médio nunca são misturados, mesmo quando têm o mesmo nome.
        </p>
      </div>

      <div className="space-y-8">
        <SubTabela titulo="Ensino Fundamental" disciplinas={disciplinasFundamental} bimestreAtual={bimestreAtual} />
        <div style={{ borderTop: "1px solid var(--border-subtle)" }} />
        <SubTabela titulo="Ensino Médio" disciplinas={disciplinasMedio} bimestreAtual={bimestreAtual} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { cor: "#ef4444", texto: "< 5,0 Abaixo do Básico" },
          { cor: "#eab308", texto: "5,0-6,9 Básico" },
          { cor: "#22c55e", texto: "7,0-8,9 Adequado" },
          { cor: "#3b82f6", texto: "9,0+ Avançado" },
        ].map(({ cor, texto }) => (
          <div
            key={texto}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)" }}
          >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cor }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{texto}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
