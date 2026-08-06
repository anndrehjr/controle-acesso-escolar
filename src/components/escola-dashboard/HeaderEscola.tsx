"use client";

import { School, LogOut, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BimestreSeletor from "./BimestreSeletor";
import TurmaSeletor from "./TurmaSeletor";

type Turma = { id: string; nome: string };

type Props = {
  nome: string;
  cidade: string;
  estado: string;
  bimestre: number;
  anoLetivo: number;
  turmas: Turma[];
  turmaAtualId: string | null;
};

export default function HeaderEscola({
  nome,
  cidade,
  estado,
  bimestre,
  anoLetivo,
  turmas,
  turmaAtualId,
}: Props) {
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
            style={{
              background: "var(--bg-app)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <School className="h-7 w-7" style={{ color: "var(--brand-primary)" }} />
          </div>

          <div>
            <div
              className="mb-3 inline-flex px-3 py-1 text-xs font-medium"
              style={{
                background: "var(--bg-app)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-pill)",
                color: "var(--text-secondary)",
              }}
            >
              Painel pedagógico
            </div>

            <h1
              className="text-2xl tracking-tight md:text-3xl"
              style={{
                color: "var(--text-primary)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              {nome}
            </h1>

            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {cidade} - {estado}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="px-3 py-1 text-xs font-medium"
                style={{
                  background: "var(--bg-app)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-pill)",
                  color: "var(--text-secondary)",
                }}
              >
                Ano letivo {anoLetivo}
              </span>
              {turmaAtualId && (
                <span
                  className="px-3 py-1 text-xs font-semibold"
                  style={{
                    background: "var(--bg-sidebar-active)",
                    borderRadius: "var(--radius-pill)",
                    color: "var(--brand-primary)",
                  }}
                >
                  Turma selecionada
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/analytics" className="flex items-center gap-2 px-3 py-2 text-sm font-medium" style={{ background: "var(--bg-app)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)" }}><BarChart2 className="h-4 w-4" />Visao Geral</Link><div className="h-6 w-px hidden sm:block" style={{ background: "var(--border-subtle)" }} /><TurmaSeletor turmas={turmas} turmaAtualId={turmaAtualId} />
          <div
            className="h-6 w-px hidden sm:block"
            style={{ background: "var(--border-subtle)" }}
          />
          <BimestreSeletor bimestreAtual={bimestre} />
          <div
            className="h-6 w-px hidden sm:block"
            style={{ background: "var(--border-subtle)" }}
          />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors"
            style={{
              background: "var(--bg-app)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
