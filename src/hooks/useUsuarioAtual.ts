"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/session";

type UsuarioAtual = {
  id: string;
  nome: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN_ESCOLA" | string;
  escola_id: string | null;
  auth_id: string;
  ativo: boolean;
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

  return {
    usuario,
    loading,
    isSuperAdmin: usuario?.role === "SUPER_ADMIN",
    isAdminEscola: usuario?.role === "ADMIN_ESCOLA",
  };
}