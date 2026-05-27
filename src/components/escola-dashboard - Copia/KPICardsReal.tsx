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
      fundo: "bg-zinc-800",
    },
    {
      titulo: "Média Geral",
      valor: mediaGeral.toFixed(1),
      subtitulo: "Média dos alunos ativos",
      Icone: Target,
      cor: "text-yellow-400",
      fundo: "bg-yellow-500/10",
    },
    {
      titulo: "Alunos Críticos",
      valor: alunosCriticos,
      subtitulo: `${alunosAbaixoBasico} abaixo do básico`,
      Icone: AlertTriangle,
      cor: "text-red-400",
      fundo: "bg-red-500/10",
    },
    {
      titulo: "Adequado + Avançado",
      valor: `${percentualAdequado.toFixed(1)}%`,
      subtitulo: `${totalAdequadosOuAvancados} estudantes`,
      Icone: GraduationCap,
      cor: "text-green-400",
      fundo: "bg-green-500/10",
    },
    {
      titulo: "Melhor Turma",
      valor: melhorTurma,
      subtitulo: `Média ${melhorTurmaMedia.toFixed(1)}`,
      Icone: TrendingUp,
      cor: "text-green-400",
      fundo: "bg-green-500/10",
    },
    {
      titulo: "Turma em Alerta",
      valor: turmaAlerta,
      subtitulo: `Média ${turmaAlertaMedia.toFixed(1)}`,
      Icone: TrendingDown,
      cor: "text-red-400",
      fundo: "bg-red-500/10",
    },
    {
      titulo: "Disciplina Crítica",
      valor: disciplinaCritica,
      subtitulo: `${disciplinaCriticaPercentual.toFixed(0)}% abaixo do básico`,
      Icone: BookOpen,
      cor: "text-red-400",
      fundo: "bg-red-500/10",
    },
    {
      titulo: "Pontos de Atenção",
      valor: alunosAtencao,
      subtitulo: "Alunos sinalizados",
      Icone: AlertCircle,
      cor: "text-yellow-400",
      fundo: "bg-yellow-500/10",
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.titulo}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-zinc-400">
              {card.titulo}
            </p>

            <div className={`p-3 rounded-xl ${card.fundo}`}>
              <card.Icone className={`w-5 h-5 ${card.cor}`} />
            </div>
          </div>

          <h2 className={`text-3xl font-bold mt-6 ${card.cor}`}>
            {card.valor}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            {card.subtitulo}
          </p>
        </div>
      ))}
    </section>
  );
}