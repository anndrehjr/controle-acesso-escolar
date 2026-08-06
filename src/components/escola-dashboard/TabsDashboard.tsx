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
    <div className="mt-6">
      <div
        className="p-1"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className={`grid grid-cols-2 gap-1 ${colunas}`}>
          {abas.map((aba) => {
            const isAtiva = abaAtiva === aba.id;
            const isComparativo = aba.id === "comparativo";
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className="px-4 py-2.5 text-sm transition"
                style={{
                  borderRadius: "var(--radius-sm)",
                  fontWeight: isAtiva
                    ? "var(--font-weight-semibold)"
                    : "var(--font-weight-regular)",
                  background: isAtiva
                    ? isComparativo
                      ? "var(--bg-sidebar-active)"
                      : "var(--brand-primary)"
                    : "transparent",
                  color: isAtiva
                    ? isComparativo
                      ? "var(--brand-primary)"
                      : "#FFFFFF"
                    : "var(--text-secondary)",
                }}
              >
                {aba.nome}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
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
