"use client";

import { School, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  nome: string;
  cidade: string;
  estado: string;
  bimestre: number;
  anoLetivo: number;
};

export default function AnalyticsHeaderNav({ nome, cidade, estado, bimestre, anoLetivo }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header
      className="p-6 md:p-8"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center"
            style={{ background: "var(--bg-app)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}
          >
            <School className="h-7 w-7" style={{ color: "var(--brand-primary)" }} />
          </div>
          <div>
            <div
              className="mb-3 inline-flex px-3 py-1 text-xs font-medium"
              style={{ background: "var(--bg-app)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", color: "var(--text-secondary)" }}
            >
              Visao geral pedagogica
            </div>
            <h1
              className="text-2xl tracking-tight md:text-3xl"
              style={{ color: "var(--text-primary)", fontWeight: "var(--font-weight-semibold)" }}
            >
              {nome}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {cidade} - {estado}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="px-3 py-1 text-xs font-medium"
                style={{ background: "var(--bg-app)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", color: "var(--text-secondary)" }}
              >
                Ano letivo {anoLetivo}
              </span>
              <span
                className="px-3 py-1 text-xs font-medium"
                style={{ background: "var(--bg-app)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", color: "var(--text-secondary)" }}
              >
                {bimestre}o bimestre
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--brand-primary-solid)", borderRadius: "var(--radius-sm)", color: "#fff" }}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard detalhado
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
            style={{ background: "var(--bg-app)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
