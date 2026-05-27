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
    <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-900">
          Ranking de Turmas
        </h2>

        <p className="text-zinc-500 mt-1">
          Classificação por média geral
        </p>
      </div>

      <div className="space-y-4">
        {ranking.map((item, index) => (
          <div
            key={item.turma.id}
            className={`rounded-2xl border p-5 transition-all ${
              index === 0
                ? "border-green-400 bg-green-50"
                : item.media < 6
                ? "border-red-300 bg-red-50"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-xl">
                  {index + 1}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-zinc-900">
                    {item.turma.nome}
                  </h3>

                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-zinc-600">
                      {item.turma.total_ativos} alunos
                    </span>

                    <span className="text-blue-600 font-semibold">
                      {item.totalNotas} notas
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-5xl font-bold text-amber-500">
                  {item.media.toFixed(1)}
                </h2>

                <span className="text-zinc-500 text-sm">
                  média
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}