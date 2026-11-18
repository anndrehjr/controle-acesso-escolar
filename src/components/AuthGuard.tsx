"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUsuarioAtual } from "../hooks/useUsuarioAtual";
import { dashboardHomeFor, ROLES, type Role } from "../types/roles";

type Props = {
  children: ReactNode;
  allow?: Role[];
};

export default function AuthGuard({ children, allow = [...ROLES] }: Props) {
  const router = useRouter();

  const { usuario, loading, erroSessao } = useUsuarioAtual();
  const autorizado = Boolean(
    usuario && (usuario.role === "DEV_MASTER" || allow.includes(usuario.role))
  );

  useEffect(() => {
    if (loading || erroSessao) return;

    if (!usuario) {
      router.push("/login");
      return;
    }

    if (!autorizado) {
      router.replace(dashboardHomeFor(usuario.role, usuario.escola_id));
    }
  }, [usuario, loading, erroSessao, autorizado, router]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}
      >
        Carregando...
      </div>
    );
  }

  if (erroSessao) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
        style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
      >
        <p className="font-semibold">Não foi possível confirmar sua sessão agora.</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Seu acesso não foi encerrado. Verifique a conexão e tente novamente.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md px-4 py-2 text-sm font-semibold"
          style={{ background: "var(--brand-primary-solid)", color: "white" }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  if (!autorizado) {
    return null;
  }

  return <>{children}</>;
}
