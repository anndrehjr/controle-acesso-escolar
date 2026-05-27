
"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUsuarioAtual } from "../hooks/useUsuarioAtual";

type Props = {
  children: ReactNode;
  allow?: ("SUPER_ADMIN" | "ADMIN_ESCOLA")[];
};

export default function AuthGuard({
  children,
  allow = ["SUPER_ADMIN", "ADMIN_ESCOLA"],
}: Props) {
  const router = useRouter();

  const {
    usuario,
    loading,
  } = useUsuarioAtual();

  useEffect(() => {
    if (loading) return;

    if (!usuario) {
      router.push("/login");
      return;
    }

if (!allow.includes(usuario.role as "SUPER_ADMIN" | "ADMIN_ESCOLA")) {      router.push("/login");
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

  if (!allow.includes(usuario.role as "SUPER_ADMIN" | "ADMIN_ESCOLA")) {
    return null;
  }

  return <>{children}</>;
}