"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../services/auth";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    try {
      setCarregando(true);

      const { data, error } = await login(email, senha);

      if (error || !data.user) {
        alert("E-mail ou senha inválidos");
        return;
      }

      const { data: perfil, error: perfilError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_id", data.user.id)
        .single();

      if (perfilError || !perfil) {
        alert("Perfil não encontrado no sistema");
        return;
      }

      if (perfil.role === "SUPER_ADMIN") {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if (perfil.role === "ADMIN_ESCOLA") {
        router.replace(`/dashboard/escolas/${perfil.escola_id}`);
        router.refresh();
        return;
      }

      alert("Usuário sem permissão configurada");
    } catch (err) {
      console.error(err);
      alert("Erro interno ao realizar login");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(39,39,42,0.9),transparent_45%),linear-gradient(to_bottom,#09090b,#000000)]" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800/20 blur-3xl" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="grid w-full max-w-6xl items-center gap-10 md:grid-cols-2">
          <div className="hidden md:block">
            <div className="mb-6 inline-flex rounded-full border border-zinc-700/70 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300 shadow-xl backdrop-blur">
              Portal administrativo
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-white">
              Bem-vindo ao Sistema Escolar
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-400">
              Acesse sua área de gestão pedagógica, acompanhe escolas, turmas,
              dados e indicadores de desempenho.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {["Escolas", "Turmas", "Usuários", "Relatórios"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-xl backdrop-blur"
                >
                  <div className="mb-4 h-10 w-10 rounded-xl bg-zinc-800" />
                  <p className="font-semibold text-zinc-200">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur">
            <h2 className="text-3xl font-bold text-white">Login</h2>

            <p className="mt-2 text-zinc-400">
              Acesse o sistema escolar com suas credenciais.
            </p>

            <div className="mt-8">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                E-mail
              </label>
              <input
                type="email"
                placeholder="Digite seu e-mail"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Senha
              </label>
              <input
                type="password"
                placeholder="Digite sua senha"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={carregando}
              className="mt-8 w-full rounded-xl bg-white p-3 font-bold text-black shadow-xl transition hover:scale-[1.02] hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}