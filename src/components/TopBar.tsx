"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [mostrarVoltarAoTopo, setMostrarVoltarAoTopo] = useState(false);
  const ultimoY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const paginaLonga = document.documentElement.scrollHeight > window.innerHeight * 1.5;
      setMostrarVoltarAoTopo(paginaLonga && y > Math.max(500, window.innerHeight * 0.6));
      if (y < 32) {
        setVisible(true);
      } else if (y > ultimoY.current + 4) {
        setVisible(false); // rolando pra baixo
      } else if (y < ultimoY.current - 4) {
        setVisible(true); // rolando pra cima
      }
      ultimoY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  // Na tela de login não há sessão nem nada pra alternar aqui — barra some.
  if (pathname === "/login") return null;

  return (
    <>
    {/* A altura fica reservada no fluxo para o conteúdo não saltar quando a barra some. */}
    <div
      className={`nao-imprimir sticky top-0 z-40 flex h-9 items-center justify-between gap-3 px-3 backdrop-blur-md transition-opacity duration-300 ease-in-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{
        background: "color-mix(in srgb, var(--bg-card) 80%, transparent)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <UserMenu />
      <ThemeToggle />
    </div>
    <button
      type="button"
      aria-label="Voltar ao início da página"
      title="Voltar ao início"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`nao-imprimir fixed bottom-5 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border shadow-xl transition-all duration-300 md:bottom-7 md:right-7 ${
        mostrarVoltarAoTopo
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-3 scale-90 opacity-0"
      }`}
      style={{
        color: "white",
        background: "var(--brand-primary-solid)",
        borderColor: "color-mix(in srgb, white 22%, transparent)",
        boxShadow: "0 12px 30px color-mix(in srgb, var(--brand-primary-solid) 35%, transparent)",
      }}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
    </>
  );
}
