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
    <div className="fixed top-4 left-4 z-50 flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/90 py-1.5 pl-1.5 pr-2 text-sm text-zinc-300 shadow-xl backdrop-blur">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800">
        <User className="h-3.5 w-3.5" />
      </span>
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="font-medium text-white">{usuario.nome}</span>
        <span className="text-[11px] text-zinc-400">
          {NOME_PAPEL[usuario.role] ?? usuario.role}
        </span>
      </span>

      {capacidades?.manageUsuarios && (
        <Link
          href="/dashboard/usuarios"
          title="Usuários"
          aria-label="Usuários"
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <Users className="h-3.5 w-3.5" />
        </Link>
      )}

      {capacidades?.viewAuditLogs && (
        <Link
          href="/dashboard/logs"
          title="Logs de auditoria"
          aria-label="Logs de auditoria"
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <ScrollText className="h-3.5 w-3.5" />
        </Link>
      )}

      <button
        onClick={handleLogout}
        disabled={saindo}
        title="Sair"
        aria-label="Sair"
        className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-red-950/60 hover:text-red-300 disabled:opacity-50"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
