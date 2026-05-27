import {
  Users,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Target,
  AlertCircle,
} from "lucide-react";

type Props = {
  totalAlunos: number;
  totalTurmas: number;
  mediaGeral: number;
  alunosCriticos: number;
  alunosAbaixoBasico: number;
  percentualAdequado: number;
  totalAdequadosOuAvancados: number;
  melhorTurma: string;
  melhorTurmaMedia: number;
  turmaAlerta: string;
  turmaAlertaMedia: number;
  disciplinaCritica: string;
  disciplinaCriticaPercentual: number;
  alunosAtencao: number;
};

export default function KPICardsReal({
  totalAlunos,
  totalTurmas,
  mediaGeral,
  alunosCriticos,
  alunosAbaixoBasico,
  percentualAdequado,
  totalAdequadosOuAvancados,
  melhorTurma,
  melhorTurmaMedia,
  turmaAlerta,
  turmaAlertaMedia,
  disciplinaCritica,
  disciplinaCriticaPercentual,
  alunosAtencao,
}: Props) {
  const cards = [
    {
      titulo: "Total de Alunos",
      valor: totalAlunos,
      subtitulo: `${totalTurmas} turmas ativas`,
      Icone: Users,
      cor: "text-white",
      fundo: "bg-zinc-800/80",
      brilho: "bg-white/5",
    },
    {
      titulo: "Média Geral",
      valor: mediaGeral.toFixed(1),
      subtitulo: "Média dos alunos ativos",
      Icone: Target,
      cor: "text-yellow-300",
      fundo: "bg-yellow-500/10",
      brilho: "bg-yellow-500/10",
    },
    {
      titulo: "Alunos Críticos",
      valor: alunosCriticos,
      subtitulo: `${alunosAbaixoBasico} abaixo do básico`,
      Icone: AlertTriangle,
      cor: "text-red-300",
      fundo: "bg-red-500/10",
      brilho: "bg-red-500/10",
    },
    {
      titulo: "Adequado + Avançado",
      valor: `${percentualAdequado.toFixed(1)}%`,
      subtitulo: `${totalAdequadosOuAvancados} estudantes`,
      Icone: GraduationCap,
      cor: "text-green-300",
      fundo: "bg-green-500/10",
      brilho: "bg-green-500/10",
    },
    {
      titulo: "Melhor Turma",
      valor: melhorTurma,
      subtitulo: `Média ${melhorTurmaMedia.toFixed(1)}`,
      Icone: TrendingUp,
      cor: "text-green-300",
      fundo: "bg-green-500/10",
      brilho: "bg-green-500/10",
    },
    {
      titulo: "Turma em Alerta",
      valor: turmaAlerta,
      subtitulo: `Média ${turmaAlertaMedia.toFixed(1)}`,
      Icone: TrendingDown,
      cor: "text-red-300",
      fundo: "bg-red-500/10",
      brilho: "bg-red-500/10",
    },
    {
      titulo: "Disciplina Crítica",
      valor: disciplinaCritica,
      subtitulo: `${disciplinaCriticaPercentual.toFixed(0)}% abaixo do básico`,
      Icone: BookOpen,
      cor: "text-red-300",
      fundo: "bg-red-500/10",
      brilho: "bg-red-500/10",
    },
    {
      titulo: "Pontos de Atenção",
      valor: alunosAtencao,
      subtitulo: "Alunos sinalizados",
      Icone: AlertCircle,
      cor: "text-yellow-300",
      fundo: "bg-yellow-500/10",
      brilho: "bg-yellow-500/10",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.titulo}
          className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/20"
        >
          <div className={`absolute -right-16 -top-16 h-40 w-40 rounded-full ${card.brilho} blur-3xl transition group-hover:opacity-100`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%)]" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {card.titulo}
            </p>

            <div className={`rounded-2xl border border-zinc-700/60 p-3 ${card.fundo}`}>
              <card.Icone className={`h-5 w-5 ${card.cor}`} />
            </div>
          </div>

          <h2 className={`relative z-10 mt-7 truncate text-3xl font-black tracking-tight md:text-4xl ${card.cor}`}>
            {card.valor}
          </h2>

          <p className="relative z-10 mt-2 text-sm font-medium text-zinc-500">
            {card.subtitulo}
          </p>
        </div>
      ))}
    </section>
  );
}
