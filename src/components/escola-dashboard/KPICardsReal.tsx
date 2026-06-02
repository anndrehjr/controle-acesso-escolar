"use client";

import { useState } from "react";
import {
  Users,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Target,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

type AlunoDestaque = {
  id: string;
  nome: string;
  numeroChamada: number;
  media: number | null;
};

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
  turmaFiltrada?: boolean;
  melhorAluno?: AlunoDestaque | null;
  pioresAlunos?: AlunoDestaque[];
};

function rotulo(aluno: AlunoDestaque, mostrarNomes: boolean) {
  if (mostrarNomes) return aluno.nome;
  return `Nº ${String(aluno.numeroChamada).padStart(2, "0")}`;
}

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
  turmaFiltrada = false,
  melhorAluno,
  pioresAlunos = [],
}: Props) {
  const [mostrarNomes, setMostrarNomes] = useState(true);

  const cardsBase = [
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
    <section className="space-y-4">
      {turmaFiltrada && (
        <div className="flex justify-end">
          <button
            onClick={() => setMostrarNomes((v) => !v)}
            className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            {mostrarNomes ? (
              <>
                <EyeOff className="h-4 w-4" />
                Ocultar nomes
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Mostrar nomes
              </>
            )}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cardsBase.map((card) => (
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

        {turmaFiltrada ? (
          <>
            {/* Destaque da Turma */}
            <div className="group relative overflow-hidden rounded-3xl border border-green-900/40 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-green-700/40">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-green-500/10 blur-3xl transition group-hover:opacity-100" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%)]" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  Destaque da Turma
                </p>
                <div className="rounded-2xl border border-zinc-700/60 p-3 bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-300" />
                </div>
              </div>

              {melhorAluno ? (
                <>
                  <Link
                    href={`/dashboard/aluno/${melhorAluno.id}`}
                    className="relative z-10 mt-7 block truncate text-2xl font-black tracking-tight text-green-300 hover:underline md:text-3xl"
                  >
                    {rotulo(melhorAluno, mostrarNomes)}
                  </Link>
                  <p className="relative z-10 mt-2 text-sm font-medium text-zinc-500">
                    Média {melhorAluno.media?.toFixed(1) ?? "-"} · melhor da sala
                  </p>
                </>
              ) : (
                <p className="relative z-10 mt-7 text-zinc-500">Sem dados</p>
              )}
            </div>

            {/* Alertas da Turma */}
            <div className="group relative overflow-hidden rounded-3xl border border-red-900/40 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-red-700/40">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-500/10 blur-3xl transition group-hover:opacity-100" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%)]" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  Alertas da Turma
                </p>
                <div className="rounded-2xl border border-zinc-700/60 p-3 bg-red-500/10">
                  <TrendingDown className="h-5 w-5 text-red-300" />
                </div>
              </div>

              {pioresAlunos.length > 0 ? (
                <ul className="relative z-10 mt-5 space-y-2">
                  {pioresAlunos.map((a, idx) => (
                    <li key={a.id} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-red-900/50 bg-red-950/60 text-xs font-black text-red-400">
                        {idx + 1}
                      </span>
                      <Link
                        href={`/dashboard/aluno/${a.id}`}
                        className="min-w-0 flex-1 truncate text-sm font-bold text-red-200 hover:underline"
                      >
                        {rotulo(a, mostrarNomes)}
                      </Link>
                      <span className="shrink-0 text-sm font-black text-red-400">
                        {a.media?.toFixed(1) ?? "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="relative z-10 mt-7 text-zinc-500">Sem dados</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/20">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-green-500/10 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%)]" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Melhor Turma</p>
                <div className="rounded-2xl border border-zinc-700/60 p-3 bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-300" />
                </div>
              </div>
              <h2 className="relative z-10 mt-7 truncate text-3xl font-black tracking-tight text-green-300 md:text-4xl">
                {melhorTurma}
              </h2>
              <p className="relative z-10 mt-2 text-sm font-medium text-zinc-500">
                Média {melhorTurmaMedia.toFixed(1)}
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/20">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%)]" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Turma em Alerta</p>
                <div className="rounded-2xl border border-zinc-700/60 p-3 bg-red-500/10">
                  <TrendingDown className="h-5 w-5 text-red-300" />
                </div>
              </div>
              <h2 className="relative z-10 mt-7 truncate text-3xl font-black tracking-tight text-red-300 md:text-4xl">
                {turmaAlerta}
              </h2>
              <p className="relative z-10 mt-2 text-sm font-medium text-zinc-500">
                Média {turmaAlertaMedia.toFixed(1)}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
