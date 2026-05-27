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
  const itens = [
    { titulo: "Alunos em atenção", valor: alunosAtencao },
    { titulo: "Alunos transferidos", valor: alunosTransferidos },
    { titulo: "Total de notas válidas", valor: totalNotas },
    { titulo: "Bimestre atual", valor: `${bimestre}º` },
    { titulo: "Ano letivo", valor: anoLetivo },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />

      <div className="relative z-10 mb-6">
        <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
          Síntese pedagógica
        </div>

        <h2 className="text-2xl font-black tracking-tight md:text-3xl">
          Resumo Pedagógico
        </h2>
      </div>

      <div className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {itens.map((item) => (
          <div
            key={item.titulo}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg"
          >
            <p className="text-sm font-semibold text-zinc-500">
              {item.titulo}
            </p>

            <h3 className="mt-3 text-3xl font-black text-white">
              {item.valor}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}
