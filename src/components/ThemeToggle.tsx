"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    setTheme(saved ?? "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  // Evita mismatch de hidratação mostrando somente após mount no cliente
  if (!mounted) return <div className="h-6 w-6" aria-hidden />;

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
    >
      {theme === "dark" ? (
        <Sun className="h-3 w-3" aria-hidden />
      ) : (
        <Moon className="h-3 w-3" aria-hidden />
      )}
    </button>
  );
}
