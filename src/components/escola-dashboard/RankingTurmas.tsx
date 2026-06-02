import Link from "next/link";

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
};

export default function RankingTurmas({
  ranking,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />

      <div className="relative z-10 mb-6">
        <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
          Desempenho por turma
        </div>

        <h2 className="text-2xl font-black tracking-tight md:text-3xl">
          Ranking de Turmas
        </h2>

        <p className="mt-2 text-sm text-zinc-400 md:text-base">
          Classificação por média geral
        </p>
      </div>

      <div className="relative z-10 space-y-4">
        {ranking.map((item, index) => {
          const destaque =
            index === 0
              ? "border-green-500/40 bg-green-500/10"
              : item.media < 6
              ? "border-red-500/40 bg-red-500/10"
              : "border-zinc-800 bg-zinc-900/70";

          const corMedia =
            index === 0
              ? "text-green-300"
              : item.media < 6
              ? "text-red-300"
              : "text-yellow-300";

          return (
            <div
              key={item.turma.id}
              className={`rounded-3xl border p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-white/20 ${destaque}`}
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 text-xl font-black text-white shadow-xl">
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-white">
                      {item.turma.nome}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full border border-zinc-700 bg-black/20 px-3 py-1 font-semibold text-zinc-300">
                        {item.turma.total_ativos} alunos
                      </span>

                      <span className="rounded-full border border-zinc-700 bg-black/20 px-3 py-1 font-semibold text-zinc-300">
                        {item.totalNotas} notas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-zinc-700 bg-black/20 px-6 py-4 text-center">
                    <h2 className={`text-5xl font-black tracking-tight ${corMedia}`}>
                      {item.media.toFixed(1)}
                    </h2>
                    <span className="text-sm font-semibold text-zinc-500">
                      média
                    </span>
                  </div>

                  <Link
                    href={`/dashboard?turma=${item.turma.id}&tab=comparativo`}
                    className="shrink-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-sm font-bold text-zinc-300 transition hover:border-white/40 hover:bg-zinc-800 hover:text-white"
                  >
                    B1 × B2
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {ranking.length === 0 && (
        <div className="relative z-10 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
          Nenhum dado de ranking encontrado.
        </div>
      )}
    </div>
  );
}
