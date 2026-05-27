"use client";

import { useState } from "react";

type Aba = "visao" | "turmas" | "disciplinas" | "alertas" | "heatmap";

type Props = {
  visaoGeral: React.ReactNode;
  turmas: React.ReactNode;
  disciplinas: React.ReactNode;
  alertas: React.ReactNode;
  heatmap: React.ReactNode;
};

export default function TabsDashboard({
  visaoGeral,
  turmas,
  disciplinas,
  alertas,
  heatmap,
}: Props) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("visao");

  const abas = [
    { id: "visao", nome: "Visão Geral" },
    { id: "turmas", nome: "Turmas" },
    { id: "disciplinas", nome: "Disciplinas" },
    { id: "alertas", nome: "Alertas" },
    { id: "heatmap", nome: "Heatmap" },
  ] as const;

  return (
    <div className="mt-8">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-2 shadow-2xl backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />

        <div className="relative z-10 grid grid-cols-2 gap-2 md:grid-cols-5">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition md:text-base ${
                abaAtiva === aba.id
                  ? "bg-white text-black shadow-xl"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {aba.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {abaAtiva === "visao" && visaoGeral}
        {abaAtiva === "turmas" && turmas}
        {abaAtiva === "disciplinas" && disciplinas}
        {abaAtiva === "alertas" && alertas}
        {abaAtiva === "heatmap" && heatmap}
      </div>
    </div>
  );
}
