"use client";

import { Info } from "lucide-react";

type Props = {
  texto: string;
  /** Alinhamento do painel em relação ao ícone. Padrão: centralizado. */
  align?: "center" | "start" | "end";
};

const alinhamento: Record<NonNullable<Props["align"]>, string> = {
  center: "left-1/2 -translate-x-1/2",
  start: "left-0",
  end: "right-0",
};

/**
 * Ícone de informação com tooltip explicativo, acessível via mouse e teclado.
 * Uso: ao lado de qualquer KPI, gráfico ou indicador calculado, explicando
 * o que o número representa, como é calculado e de onde vêm os dados.
 */
export default function InfoTooltip({ texto, align = "center" }: Props) {
  return (
    <span className="group/tooltip relative inline-flex shrink-0">
      <Info
        className="h-3.5 w-3.5 cursor-help outline-none"
        style={{ color: "var(--text-secondary)" }}
        tabIndex={0}
        role="button"
        aria-label={texto}
      />
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-50 mb-2 w-60 rounded-lg p-3 text-xs font-normal normal-case leading-relaxed opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${alinhamento[align]}`}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
          boxShadow: "var(--shadow-card-hover)",
        }}
      >
        {texto}
      </span>
    </span>
  );
}
