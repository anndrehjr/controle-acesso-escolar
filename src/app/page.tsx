"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [portalAberto, setPortalAberto] = useState(false);

  function acessarPortal() {
    setPortalAberto(true);

    setTimeout(() => {
      router.push("/login");
    }, 950);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Fundo decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(39,39,42,0.9),transparent_45%),linear-gradient(to_bottom,#09090b,#000000)]" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800/20 blur-3xl" />

      {/* Elementos sutis */}
      <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex rounded-full border border-zinc-700/70 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300 shadow-xl backdrop-blur">
              Plataforma institucional inteligente
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
              Sistema Escolar
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              Gestão pedagógica inteligente para escolas
            </p>

            <div className="mt-10 flex justify-center">
              <button
                onClick={acessarPortal}
                disabled={portalAberto}
                className="group relative overflow-hidden rounded-full bg-white px-8 py-4 font-semibold text-black shadow-2xl shadow-zinc-950 transition duration-300 hover:scale-105 hover:bg-zinc-200 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">Acessar Portal</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-zinc-300/80 to-transparent transition duration-700 group-hover:translate-x-full" />
              </button>
            </div>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-4">
            {[
              { titulo: "Escola", texto: "Ambiente centralizado" },
              { titulo: "Dados", texto: "Informações organizadas" },
              { titulo: "Turmas", texto: "Acompanhamento pedagógico" },
              { titulo: "Desempenho", texto: "Indicadores de evolução" },
            ].map((item) => (
              <div
                key={item.titulo}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:border-zinc-600"
              >
                <div className="mb-4 h-10 w-10 rounded-xl bg-zinc-800" />
                <h2 className="text-lg font-semibold text-zinc-100">
                  {item.titulo}
                </h2>
                <p className="mt-2 text-sm text-zinc-500">{item.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animação do portal */}
      {portalAberto && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute h-24 w-24 animate-[portal_950ms_ease-in-out_forwards] rounded-full border border-white/40 bg-white/10 shadow-[0_0_80px_rgba(255,255,255,0.45)]" />
          <div className="absolute inset-0 animate-[escurecer_950ms_ease-in-out_forwards] bg-black/0" />
        </div>
      )}

      <style jsx>{`
        @keyframes portal {
          0% {
            transform: scale(0.2);
            opacity: 0.9;
          }
          45% {
            opacity: 1;
          }
          100% {
            transform: scale(35);
            opacity: 1;
          }
        }

        @keyframes escurecer {
          0% {
            background: rgba(0, 0, 0, 0);
          }
          100% {
            background: rgba(0, 0, 0, 0.92);
          }
        }
      `}</style>
    </main>
  );
}