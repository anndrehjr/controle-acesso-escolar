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

function MediaBar({ media }: { media: number }) {
  const pct = Math.min(100, Math.max(0, (media / 10) * 100));
  const cor =
    media >= 7 ? "bg-green-500 shadow-green-500/30" :
    media >= 5 ? "bg-amber-500 shadow-amber-500/30" :
    "bg-red-500 shadow-red-500/30";

  return (
    <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800 ring-1 ring-zinc-700/40">
      <div className="absolute left-1/2 top-0 z-10 h-full w-px bg-zinc-600" title="5,0" />
      <div
        className={`${cor} h-full rounded-full shadow-md transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const medalStyle = [
  { bg: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300", label: "1º" },
  { bg: "bg-zinc-400/20 border-zinc-400/40 text-zinc-300",       label: "2º" },
  { bg: "bg-orange-700/20 border-orange-700/40 text-orange-400", label: "3º" },
];

export default function RankingTurmas({ ranking }: Props) {
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
          Classificação por média geral · linha central = 5,0
        </p>
      </div>

      <div className="relative z-10 space-y-4">
        {ranking.map((item, index) => {
          const medal = index < 3 ? medalStyle[index] : null;

          const destaque =
            index === 0
              ? "border-green-500/40 bg-green-500/10"
              : item.media < 6
              ? "border-red-500/40 bg-red-500/10"
              : "border-zinc-800 bg-zinc-900/70";

          const corMedia =
            item.media >= 7 ? "text-green-300" :
            item.media >= 5 ? "text-amber-300" :
            "text-red-300";

          return (
            <div
              key={item.turma.id}
              className={`rounded-3xl border p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-white/20 ${destaque}`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-lg font-black shadow-xl ${
                      medal ? medal.bg : "border-zinc-700 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    {medal ? medal.label : `${index + 1}º`}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-black tracking-tight text-white md:text-2xl">
                      {item.turma.nome}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full border border-zinc-700 bg-black/20 px-3 py-0.5 font-semibold text-zinc-300">
                        {item.turma.total_ativos} alunos
                      </span>
                      <span className="rounded-full border border-zinc-700 bg-black/20 px-3 py-0.5 font-semibold text-zinc-300">
                        {item.totalNotas} notas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-zinc-700 bg-black/20 px-5 py-3 text-center">
                    <h2 className={`text-4xl font-black tracking-tight ${corMedia}`}>
                      {item.media.toFixed(1)}
                    </h2>
                    <span className="text-xs font-semibold text-zinc-500">média</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/dashboard?turma=${item.turma.id}&tab=comparativo`}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-center text-xs font-bold text-zinc-300 transition hover:border-white/40 hover:bg-zinc-800 hover:text-white"
                    >
                      B1 × B2
                    </Link>
                    <Link
                      href={`/dashboard?turma=${item.turma.id}&tab=heatmap`}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-center text-xs font-bold text-zinc-300 transition hover:border-indigo-500/40 hover:bg-indigo-950/20 hover:text-indigo-300"
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
        <div className="relative z-10 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
          Nenhum dado de ranking encontrado.
        </div>
      )}
    </div>
  );
}
