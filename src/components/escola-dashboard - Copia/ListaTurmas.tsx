type Turma = {
  id: string;
  nome: string;
  total_ativos: number;
};

type Props = {
  turmas: Turma[];
};

export default function ListaTurmas({ turmas }: Props) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <h2 className="text-xl font-bold mb-4">
        Turmas da Escola
      </h2>

      <div className="space-y-3">
        {turmas.map((turma) => (
          <div
            key={turma.id}
            className="bg-zinc-800 p-4 rounded-xl flex justify-between"
          >
            <span>{turma.nome}</span>

            <span className="text-zinc-400">
              {turma.total_ativos} alunos
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}