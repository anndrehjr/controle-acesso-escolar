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
  if (percentual >= 30) return { label: "Crítico",  cls: "border-red-500/30 bg-red-500/10 text-red-400" };
  if (percentual >= 20) return { label: "Alerta",   cls: "border-amber-500/30 bg-amber-500/10 text-amber-400" };
  if (percentual >= 10) return { label: "Atenção",  cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" };
  return                       { label: "Bom",      cls: "border-green-500/30 bg-green-500/10 text-green-400" };
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
        {disciplinas.map((item, index) => {
          const percentual = Math.round(item.percentual);
          const severidade = getSeveridade(percentual);

          const corBarra =
            percentual >= 30 ? "bg-red-500 shadow-red-500/30" :
            percentual >= 20 ? "bg-amber-500 shadow-amber-500/30" :
            percentual >= 10 ? "bg-yellow-500 shadow-yellow-500/30" :
            "bg-green-500 shadow-green-500/30";

          return (
            <div
              key={item.disciplina.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-white/20 hover:bg-zinc-900"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-black text-zinc-400">
                  {index + 1}
                </span>

                <span className="min-w-0 flex-1 truncate text-base font-bold text-zinc-100 md:text-lg">
                  {item.disciplina.nome}
                </span>

                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${severidade.cls}`}>
                    {severidade.label}
                  </span>
                  <span className="rounded-full border border-zinc-700 bg-black/30 px-3 py-1 text-base font-black text-white">
                    {percentual}%
                  </span>
                </div>
              </div>

              <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-800 ring-1 ring-zinc-700/60 md:h-5">
                <div
                  className={`${corBarra} h-full rounded-full shadow-lg transition-all duration-700`}
                  style={{ width: `${percentual}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                <span className="font-semibold text-zinc-400">{item.totalCritico} abaixo de 5,0</span>
                {item.totalNotas !== undefined && (
                  <span>de {item.totalNotas} notas</span>
                )}
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

export default function DisciplinasCriticas({ geral, fundamental, medio }: Props) {
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
