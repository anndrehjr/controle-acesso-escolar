"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
};

/**
 * Modal genérico reutilizável — painel centralizado com fundo escurecido,
 * fecha com Esc ou clique fora. Usado pelos cards do dashboard executivo
 * pra abrir a análise detalhada de cada indicador.
 */
export default function Modal({ aberto, onFechar, titulo, subtitulo, children }: Props) {
  useEffect(() => {
    if (!aberto) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto p-4 py-8 md:p-8"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        className="w-full max-w-3xl shrink-0 p-6 md:p-8"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "1.25rem",
          boxShadow: "var(--shadow-card-hover)",
        }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl tracking-tight" style={{ color: "var(--text-primary)", fontWeight: 650 }}>
              {titulo}
            </h2>
            {subtitulo && (
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                {subtitulo}
              </p>
            )}
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center transition"
            style={{
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-app)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
