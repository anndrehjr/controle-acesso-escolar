"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Users, ScrollText } from "lucide-react";
import { useUsuarioAtual } from "../hooks/useUsuarioAtual";
import { logout } from "../services/auth";

const NOME_PAPEL: Record<string, string> = {
  SUPER_ADMIN: "Administrador geral",
  ADMIN_ESCOLA: "Coordenador",
  PROFESSOR: "Professor",
  LEITOR: "Somente leitura",
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
    <div className="flex items-center gap-0.5 text-xs text-zinc-400">
      <User className="h-3 w-3 text-zinc-500" />
      <span className="ml-1 hidden font-medium text-zinc-300 sm:inline">
        {usuario.nome}
      </span>
      <span className="hidden text-zinc-600 md:inline">
        · {NOME_PAPEL[usuario.role] ?? usuario.role}
      </span>

      {capacidades?.manageUsuarios && (
        <Link
          href="/dashboard/usuarios"
          title="Usuários"
          aria-label="Usuários"
          className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
        >
          <Users className="h-3 w-3" />
        </Link>
      )}

      {capacidades?.viewAuditLogs && (
        <Link
          href="/dashboard/logs"
          title="Logs de auditoria"
          aria-label="Logs de auditoria"
          className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
        >
          <ScrollText className="h-3 w-3" />
        </Link>
      )}

      <button
        onClick={handleLogout}
        disabled={saindo}
        title="Sair"
        aria-label="Sair"
        className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
      >
        <LogOut className="h-3 w-3" />
      </button>
    </div>
  );
}
