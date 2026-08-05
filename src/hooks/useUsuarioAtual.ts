"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getCurrentUser } from "../services/session";
import type { Role } from "../types/roles";
import { capabilitiesFor } from "../types/roles";

type UsuarioAtual = {
  id: string;
  nome: string;
  email: string;
  role: Role;
  escola_id: string | null;
};

export function useUsuarioAtual() {
  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Recarrega a cada troca de rota: o layout raiz (onde este hook normalmente é usado,
    // ex. UserMenu) não é remontado em navegações client-side, então sem isso a sessão só
    // seria checada uma vez — inclusive antes do login acontecer, na primeira visita a /login.
    let cancelado = false;

    async function carregarUsuario() {
      const usuarioAtual = await getCurrentUser();
      if (!cancelado) {
        setUsuario(usuarioAtual as UsuarioAtual | null);
        setLoading(false);
      }
    }

    carregarUsuario();

    return () => {
      cancelado = true;
    };
  }, [pathname]);

  const capacidades = usuario ? capabilitiesFor(usuario.role) : null;

  return {
    usuario,
    loading,
    isSuperAdmin: usuario?.role === "SUPER_ADMIN",
    isAdminEscola: usuario?.role === "ADMIN_ESCOLA",
    isProfessor: usuario?.role === "PROFESSOR",
    isLeitor: usuario?.role === "LEITOR",
    capacidades,
  };
}
