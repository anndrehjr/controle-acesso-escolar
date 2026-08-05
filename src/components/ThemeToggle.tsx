"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial = saved ?? "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      style={{
        position: "fixed",
        top: "12px",
        right: "12px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-card)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        boxShadow: "var(--shadow-card)",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-primary)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-primary)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)";
      }}
    >
      {theme === "dark" ? (
        <Sun size={16} aria-hidden />
      ) : (
        <Moon size={16} aria-hidden />
      )}
    </button>
  );
}