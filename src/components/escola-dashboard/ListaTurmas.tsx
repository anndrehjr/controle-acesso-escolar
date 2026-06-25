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

function StatusBar({ media }: { media: number }) {
  const pct = Math.min(100, Math.max(0, (media / 10) * 100));
  const cor =
    media >= 7 ? "bg-green-500" :
    media >= 5 ? "bg-amber-500" :
    "bg-red-500";

  return (
    <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
      <div className="absolute left-1/2 top-0 z-10 h-full w-px bg-zinc-600" />
      <div
        className={`${cor} h-full rounded-full transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ListaTurmas({ turmas }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />

      <div className="relative z-10 mb-6">
        <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
          Organização escolar
        </div>
        <h2 className="text-2xl font-black tracking-tight md:text-3xl">
          Turmas da Escola
        </h2>
        <p className="mt-2 text-sm text-zinc-400 md:text-base">
          Relação de turmas ativas e quantidade de alunos.
        </p>
      </div>

      <div className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {turmas.map((turma) => {
          const corMedia =
            turma.media == null ? "text-zinc-500" :
            turma.media >= 7    ? "text-green-300" :
            turma.media >= 5    ? "text-amber-300" :
            "text-red-300";

          return (
            <Link
              key={turma.id}
              href={`/dashboard?turma=${turma.id}&tab=heatmap`}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-lg font-black text-zinc-100 leading-tight">
                  {turma.nome}
                </span>

                {turma.media != null ? (
                  <span className={`shrink-0 text-2xl font-black ${corMedia}`}>
                    {turma.media.toFixed(1)}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-zinc-700 bg-black/30 px-3 py-1 text-sm font-bold text-zinc-300">
                    {turma.total_ativos} alunos
                  </span>
                )}
              </div>

              {turma.media != null && (
                <>
                  <p className="mt-2 text-xs text-zinc-500">{turma.total_ativos} alunos</p>
                  <StatusBar media={turma.media} />
                </>
              )}

              <p className="mt-3 text-xs font-semibold text-zinc-600 transition group-hover:text-zinc-400">
                Ver heatmap →
              </p>
            </Link>
          );
        })}
      </div>

      {turmas.length === 0 && (
        <div className="relative z-10 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
          Nenhuma turma encontrada.
        </div>
      )}
    </div>
  );
}
