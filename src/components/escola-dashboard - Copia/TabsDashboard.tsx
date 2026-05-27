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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-2">
        {abas.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`rounded-xl px-4 py-3 font-bold transition ${
              abaAtiva === aba.id
                ? "bg-red-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {aba.nome}
          </button>
        ))}
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