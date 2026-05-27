type Props = {
  alunosAtencao: number;
  alunosTransferidos: number;
  totalNotas: number;
  bimestre: number;
  anoLetivo: number;
};

export default function ResumoPedagogico({
  alunosAtencao,
  alunosTransferidos,
  totalNotas,
  bimestre,
  anoLetivo,
}: Props) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <h2 className="text-xl font-bold mb-4">
        Resumo Pedagógico
      </h2>

      <div className="space-y-3 text-zinc-300">
        <p>Alunos em atenção: {alunosAtencao}</p>
        <p>Alunos transferidos: {alunosTransferidos}</p>
        <p>Total de notas válidas: {totalNotas}</p>
        <p>Bimestre atual: {bimestre}</p>
        <p>Ano letivo: {anoLetivo}</p>
      </div>
    </div>
  );
}