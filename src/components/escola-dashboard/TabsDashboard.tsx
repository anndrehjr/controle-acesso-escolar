"use client";

import { useState } from "react";

type Aba = "visao" | "turmas" | "disciplinas" | "alertas" | "heatmap" | "comparativo";

type Props = {
  visaoGeral: React.ReactNode;
  turmas: React.ReactNode;
  disciplinas: React.ReactNode;
  alertas: React.ReactNode;
  heatmap: React.ReactNode;
  comparativo?: React.ReactNode;
  abaInicial?: Aba;
};

export default function TabsDashboard({
  visaoGeral,
  turmas,
  disciplinas,
  alertas,
  heatmap,
  comparativo,
  abaInicial = "visao",
}: Props) {
  const abaInicialValida =
    abaInicial === "comparativo" && !comparativo ? "visao" : abaInicial;
  const [abaAtiva, setAbaAtiva] = useState<Aba>(abaInicialValida);

  const abasBase = [
    { id: "visao" as const, nome: "Visão Geral" },
    { id: "turmas" as const, nome: "Turmas" },
    { id: "disciplinas" as const, nome: "Disciplinas" },
    { id: "alertas" as const, nome: "Alertas" },
    { id: "heatmap" as const, nome: "Heatmap" },
  ];

  const abas = comparativo
    ? [...abasBase, { id: "comparativo" as const, nome: "Comparativo" }]
    : abasBase;

  const colunas = abas.length <= 5 ? `md:grid-cols-5` : `md:grid-cols-6`;

  return (
    <div className="mt-8">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-2 shadow-2xl backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />

        <div className={`relative z-10 grid grid-cols-2 gap-2 ${colunas}`}>
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition md:text-base ${
                abaAtiva === aba.id
                  ? aba.id === "comparativo"
                    ? "bg-indigo-500 text-white shadow-xl"
                    : "bg-white text-black shadow-xl"
                  : aba.id === "comparativo"
                  ? "text-indigo-400 hover:bg-indigo-950/60 hover:text-indigo-200"
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
        {abaAtiva === "comparativo" && comparativo}
      </div>
    </div>
  );
}
