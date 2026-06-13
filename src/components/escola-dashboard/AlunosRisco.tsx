import type { AlunoRisco } from "../../lib/analytics/buildAlunosRisco";

type Props = {
  alunosRisco: AlunoRisco[];
  bimestre: number;
  turmaNome?: string | null;
};

export default function AlunosRisco({ alunosRisco, bimestre, turmaNome }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-orange-900/50 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.05),transparent_35%)]" />

      <div className="relative z-10 mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-orange-900/60 bg-orange-950/40 px-3 py-1 text-xs font-medium text-orange-400">
            Risco de reprovação
          </div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            Alertas de Risco
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            2 ou mais disciplinas abaixo do básico — {bimestre}º bimestre
            {turmaNome ? ` · ${turmaNome}` : " · Todas as turmas"}.
            Ordenados do mais crítico ao menos crítico.
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-orange-900/40 bg-orange-950/30 px-5 py-4 text-center">
          <span className="text-4xl font-black text-orange-300">{alunosRisco.length}</span>
          <p className="text-xs font-semibold text-orange-600">em risco</p>
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        {alunosRisco.map((item, idx) => (
          <div
            key={item.alunoId}
            className="rounded-2xl border border-orange-900/30 bg-orange-950/15 px-4 py-3 transition hover:border-orange-700/50 hover:bg-orange-950/25"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-orange-900/40 bg-orange-950/60 text-sm font-black text-orange-400">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold text-orange-200">{item.nome}</p>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-black text-orange-400">
                      {item.mediaGeral !== null ? item.mediaGeral.toFixed(1) : "—"}
                    </span>
                    <p className="text-xs text-zinc-600">média</p>
                  </div>
                </div>
                <p className="mb-2 text-xs text-zinc-500">{item.turmaNome}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.disciplinasRisco.map((d) => (
                    <span
                      key={d.disciplinaId}
                      className="inline-flex items-center gap-1 rounded-full border border-red-900/50 bg-red-950/40 px-2.5 py-0.5 text-xs font-semibold"
                      title={d.disciplinaNome}
                    >
                      <span className="text-red-400">{d.codigo}</span>
                      <span className="text-red-300">{d.nota.toFixed(1)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {alunosRisco.length === 0 && (
          <p className="text-zinc-400">
            Nenhum aluno com 2 ou mais disciplinas abaixo do básico neste bimestre.
          </p>
        )}
      </div>
    </div>
  );
}
