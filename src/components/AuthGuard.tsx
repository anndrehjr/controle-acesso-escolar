"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUsuarioAtual } from "../hooks/useUsuarioAtual";
import { ROLES, type Role } from "../types/roles";

type Props = {
  children: ReactNode;
  allow?: Role[];
};

export default function AuthGuard({ children, allow = [...ROLES] }: Props) {
  const router = useRouter();

  const { usuario, loading } = useUsuarioAtual();

  useEffect(() => {
    if (loading) return;

    if (!usuario) {
      router.push("/login");
      return;
    }

    if (!allow.includes(usuario.role)) {
      router.push("/login");
    }
  }, [usuario, loading, router, allow]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Carregando...
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  if (!allow.includes(usuario.role)) {
    return null;
  }

  return <>{children}</>;
}
