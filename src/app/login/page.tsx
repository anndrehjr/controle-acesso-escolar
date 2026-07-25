"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { login } from "../../services/auth";
import { dashboardHomeFor, isRole } from "../../types/roles";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarAcesso, setLembrarAcesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    try {
      setCarregando(true);

      const { usuario } = await login(email.trim(), senha, lembrarAcesso);

      if (!isRole(usuario.role)) {
        setErro("Usuário sem permissão configurada. Fale com o administrador.");
        return;
      }

      const destino = dashboardHomeFor(usuario.role, usuario.escola_id);
      router.replace(destino);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro interno ao entrar. Tente novamente.";
      setErro(message);
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

          <form
            onSubmit={handleLogin}
            className="mx-auto w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur"
          >
            <h2 className="text-3xl font-bold text-white">Login</h2>

            <p className="mt-2 text-zinc-400">
              Acesse o sistema escolar com suas credenciais.
            </p>

            {erro && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div className="mt-8">
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="Digite seu e-mail"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mt-5">
              <label htmlFor="senha" className="mb-2 block text-sm font-medium text-zinc-300">
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 pr-11 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={lembrarAcesso}
                  onChange={(e) => setLembrarAcesso(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-white"
                />
                Lembrar acesso por 30 dias
              </label>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white p-3 font-bold text-black shadow-xl transition hover:scale-[1.02] hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
              {carregando ? "Entrando..." : "Entrar"}
            </button>

            <p className="mt-5 text-center text-xs text-zinc-500">
              Esqueceu a senha? Peça para o coordenador ou administrador resetar seu acesso.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
