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
    <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm text-black">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900">
          {titulo}
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          {descricao}
        </p>
      </div>

      <div className="space-y-4">
        {disciplinas.map((item) => {
          const percentual = Math.round(item.percentual);

          const cor =
            percentual >= 30
              ? "bg-red-500"
              : percentual >= 20
              ? "bg-yellow-500"
              : percentual >= 10
              ? "bg-green-500"
              : "bg-blue-500";

          return (
            <div
              key={item.disciplina.id}
              className="flex items-center gap-4"
            >
              <div className="w-52 text-right">
                <span className="block truncate text-sm font-semibold text-zinc-900">
                  {item.disciplina.nome}
                </span>
              </div>

              <div className="flex-1">
                <div className="h-7 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`${cor} h-full rounded-full`}
                    style={{ width: `${percentual}%` }}
                  />
                </div>
              </div>

              <div className="w-20">
                <span className="text-lg font-bold text-zinc-900">
                  {percentual}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {disciplinas.length === 0 && (
        <p className="text-zinc-500">
          Nenhum dado encontrado para esta etapa.
        </p>
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
      <GraficoDisciplinas
        titulo="Componentes Curriculares Críticos — Geral"
        descricao="Percentual geral de notas abaixo do básico por disciplina."
        disciplinas={geral}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
    </div>
  );
}