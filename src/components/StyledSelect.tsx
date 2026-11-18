"use client";

import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Select nativo com a seta padrão do sistema operacional escondida
 * (appearance-none) e um ícone próprio no lugar. Sem isso, o navegador
 * desenha sua própria seta — que em telas escuras costuma renderizar como
 * um quadrado branco sem seguir a paleta do app. O color-scheme correto
 * (que também evita esse problema no menu suspenso nativo) vem do
 * globals.css, aplicado globalmente conforme o tema ativo.
 */
export default function StyledSelect({ className = "", style, onFocus, onBlur, children, ...rest }: Props) {
  return (
    <div className="relative flex w-full min-w-0">
      <select
        {...rest}
        onFocus={(e) => {
          onFocus?.(e);
          e.currentTarget.style.boxShadow = "var(--focus-ring)";
        }}
        onBlur={(e) => {
          onBlur?.(e);
          e.currentTarget.style.boxShadow = "none";
        }}
        className={`w-full appearance-none pr-9 outline-none transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        style={{
          background: "var(--bg-app)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)",
          ...style,
        }}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: "var(--text-secondary)" }}
      />
    </div>
  );
}
