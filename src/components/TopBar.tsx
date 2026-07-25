"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const ultimoY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
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
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Na tela de login não há sessão nem nada pra alternar aqui — barra some.
  if (pathname === "/login") return null;

  return (
    // Altura fixa sempre reservada no fluxo (sticky) — só a opacidade muda ao rolar,
    // pra nunca sobrepor o conteúdo abaixo nem causar salto de layout.
    <div
      className={`sticky top-0 z-40 flex h-9 items-center justify-between gap-3 bg-zinc-950/80 px-3 backdrop-blur-md transition-opacity duration-300 ease-in-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <UserMenu />
      <ThemeToggle />
    </div>
  );
}
