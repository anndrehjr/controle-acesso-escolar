"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Shield, School } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

type Props = {
  nome: string;
  cidade: string;
  estado: string;
  bimestre: number;
  anoLetivo: number;
  role: string;
};

export default function HeaderEscola({
  nome,
  cidade,
  estado,
  bimestre,
  anoLetivo,
  role,
}: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-zinc-800/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl md:h-20 md:w-20">
            <School className="h-8 w-8 text-white md:h-10 md:w-10" />
          </div>

          <div>
            <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
              Painel escolar
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              {nome}
            </h1>

            <p className="mt-2 text-sm text-zinc-400 md:text-lg">
              {cidade} - {estado}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-zinc-300">
                {bimestre}º Bimestre
              </span>

              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-zinc-300">
                Ano letivo {anoLetivo}
              </span>

              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-zinc-300">
                {role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-medium text-zinc-200 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          {role === "SUPER_ADMIN" && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-white px-4 py-2 font-bold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
            >
              <Shield className="h-4 w-4" />
              Super Admin
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 font-bold text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
