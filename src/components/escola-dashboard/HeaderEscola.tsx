"use client";

import { School } from "lucide-react";
import BimestreSeletor from "./BimestreSeletor";
import TurmaSeletor from "./TurmaSeletor";

type Turma = { id: string; nome: string };

type Props = {
  nome: string;
  cidade: string;
  estado: string;
  bimestre: number;
  anoLetivo: number;
  turmas: Turma[];
  turmaAtualId: string | null;
};

export default function HeaderEscola({
  nome,
  cidade,
  estado,
  bimestre,
  anoLetivo,
  turmas,
  turmaAtualId,
}: Props) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-zinc-800/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl md:h-20 md:w-20">
            <School className="h-8 w-8 text-white md:h-10 md:w-10" />
          </div>

          <div>
            <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
              Painel pedagógico
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              {nome}
            </h1>

            <p className="mt-2 text-sm text-zinc-400 md:text-lg">
              {cidade} - {estado}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-zinc-300">
                Ano letivo {anoLetivo}
              </span>
              {turmaAtualId && (
                <span className="rounded-full border border-blue-700/60 bg-blue-950/40 px-4 py-1.5 text-sm font-semibold text-blue-300">
                  Turma selecionada
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <TurmaSeletor turmas={turmas} turmaAtualId={turmaAtualId} />
          <div className="h-6 w-px bg-zinc-700 hidden sm:block" />
          <BimestreSeletor bimestreAtual={bimestre} />
        </div>
      </div>
    </header>
  );
}
