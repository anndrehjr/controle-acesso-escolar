"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Users, ScrollText } from "lucide-react";
import { useUsuarioAtual } from "../hooks/useUsuarioAtual";
import { logout } from "../services/auth";
import { NOME_PAPEL } from "../types/roles";

const linkIconStyle: React.CSSProperties = {
  display: "flex",
  height: "24px",
  width: "24px",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-pill)",
  color: "var(--text-secondary)",
  transition: "background-color 0.15s ease, color 0.15s ease",
};

export function UserMenu() {
  const { usuario, loading, capacidades } = useUsuarioAtual();
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  // Sem sessão (ex: na tela de login) — não mostra nada.
  if (loading || !usuario) return null;

  async function handleLogout() {
    setSaindo(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
      <User className="h-3 w-3" style={{ color: "var(--text-secondary)" }} />
      <span className="ml-1 hidden font-medium sm:inline" style={{ color: "var(--text-primary)" }}>
        {usuario.nome}
      </span>
      <span className="hidden md:inline" style={{ color: "var(--text-secondary)" }}>
        · {NOME_PAPEL[usuario.role] ?? usuario.role}
      </span>

      {capacidades?.manageUsuarios && (
        <Link
          href="/dashboard/usuarios"
          title="Usuários"
          aria-label="Usuários"
          className="ml-2"
          style={linkIconStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--brand-primary)";
            e.currentTarget.style.background = "var(--bg-sidebar-active)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Users className="h-3 w-3" />
        </Link>
      )}

      {capacidades?.viewAuditLogs && (
        <Link
          href="/dashboard/logs"
          title="Logs de auditoria"
          aria-label="Logs de auditoria"
          style={linkIconStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--brand-primary)";
            e.currentTarget.style.background = "var(--bg-sidebar-active)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ScrollText className="h-3 w-3" />
        </Link>
      )}

      <button
        onClick={handleLogout}
        disabled={saindo}
        title="Sair"
        aria-label="Sair"
        className="ml-1 disabled:opacity-50"
        style={linkIconStyle}
        onMouseEnter={(e) => {
          if (saindo) return;
          e.currentTarget.style.color = "var(--brand-accent-red)";
          e.currentTarget.style.background = "var(--status-danger-tint)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-secondary)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <LogOut className="h-3 w-3" />
      </button>
    </div>
  );
}
