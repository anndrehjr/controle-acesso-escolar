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
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />

      <div className="relative z-10 mb-8">
        <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
          Análise curricular
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
          {titulo}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-base">
          {descricao}
        </p>
      </div>

      <div className="relative z-10 space-y-5">
        {disciplinas.map((item) => {
          const percentual = Math.round(item.percentual);

          const cor =
            percentual >= 30
              ? "bg-red-500 shadow-red-500/30"
              : percentual >= 20
              ? "bg-yellow-500 shadow-yellow-500/30"
              : percentual >= 10
              ? "bg-green-500 shadow-green-500/30"
              : "bg-blue-500 shadow-blue-500/30";

          return (
            <div
              key={item.disciplina.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-white/20 hover:bg-zinc-900"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="truncate text-base font-bold text-zinc-100 md:text-lg">
                  {item.disciplina.nome}
                </span>

                <span className="rounded-full border border-zinc-700 bg-black/30 px-3 py-1 text-lg font-black text-white">
                  {percentual}%
                </span>
              </div>

              <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-800 ring-1 ring-zinc-700/60 md:h-5">
                <div
                  className={`${cor} h-full rounded-full shadow-lg transition-all duration-700`}
                  style={{ width: `${percentual}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                <span>{item.totalCritico} críticos</span>
                {item.totalNotas !== undefined && <span>• {item.totalNotas} notas</span>}
              </div>
            </div>
          );
        })}
      </div>

      {disciplinas.length === 0 && (
        <div className="relative z-10 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
          Nenhum dado encontrado para esta etapa.
        </div>
      )}
    </div>
  );
}

export default function DisciplinasCriticas({
  geral,
  fundamental,
  medio,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
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
