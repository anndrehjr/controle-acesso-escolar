"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function carregarUsuario() {
      const usuarioAtual = await getCurrentUser();

      setUsuario(usuarioAtual as UsuarioAtual | null);
      setLoading(false);
    }

    carregarUsuario();
  }, []);

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
