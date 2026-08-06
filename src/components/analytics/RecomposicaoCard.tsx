type RecomposicaoItem = {
  disciplina: { id: string; nome: string };
  abaixoB1: number;
  abaixoB2: number;
  recuperados: number;
};

type Props = {
  disciplinas: RecomposicaoItem[];
};

export default function RecomposicaoCard({ disciplinas }: Props) {
  const totalRecuperados = disciplinas.reduce((s, d) => s + d.recuperados, 0);
  const totalAbaixoB1 = disciplinas.reduce((s, d) => s + d.abaixoB1, 0);
  const percentual = totalAbaixoB1 > 0
    ? ((totalRecuperados / totalAbaixoB1) * 100).toFixed(0)
    : null;

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div
            className="mb-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)", color: "var(--text-secondary)" }}
          >
            Recomposicao da aprendizagem
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Recuperacao entre Bimestres
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Alunos abaixo de 5,0: 1o vs 2o bimestre
          </p>
        </div>
        {totalRecuperados > 0 && (
          <div
            className="shrink-0 rounded-2xl border px-5 py-3 text-center"
            style={{ borderColor: "#22c55e40", background: "#22c55e10" }}
          >
            <p className="text-3xl font-black" style={{ color: "#22c55e" }}>{totalRecuperados}</p>
            <p className="text-xs font-medium" style={{ color: "#22c55e" }}>alunos recuperados</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {disciplinas.map((d) => {
          const diff = d.abaixoB1 - d.abaixoB2;
          return (
            <div
              key={d.disciplina.id}
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{d.disciplina.nome}</p>
                {d.recuperados > 0 ? (
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "#22c55e18", color: "#22c55e" }}>
                    +{d.recuperados} sairam da zona critica
                  </span>
                ) : diff < 0 ? (
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "#ef444418", color: "#ef4444" }}>
                    {Math.abs(diff)} novos abaixo
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>sem alteracao</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg p-2" style={{ background: "var(--bg-card)" }}>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>1o Bim</p>
                  <p className="text-lg font-black" style={{ color: d.abaixoB1 > 0 ? "#ef4444" : "#22c55e" }}>{d.abaixoB1}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>abaixo de 5,0</p>
                </div>
                <div className="rounded-lg p-2" style={{ background: "var(--bg-card)" }}>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>2o Bim</p>
                  <p className="text-lg font-black" style={{ color: d.abaixoB2 > 0 ? "#ef4444" : "#22c55e" }}>{d.abaixoB2}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>abaixo de 5,0</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {percentual !== null && totalRecuperados > 0 && (
        <p
          className="mt-4 text-sm text-center font-medium pt-4"
          style={{ color: "#22c55e", borderTop: "1px solid var(--border-subtle)" }}
        >
          {percentual}% dos alunos que estavam abaixo no 1o bimestre melhoraram no 2o.
        </p>
      )}
    </div>
  );
}
