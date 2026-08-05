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
    <main
      className="min-h-screen flex items-center justify-center px-6 py-10"
      style={{ background: "var(--bg-app)" }}
    >
      <div className="w-full max-w-md">
        <form
          onSubmit={handleLogin}
          className="p-8"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div className="mb-6">
            <h1
              className="text-2xl"
              style={{
                color: "var(--text-primary)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              Sistema Escolar
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Acesse o sistema escolar com suas credenciais.
            </p>
          </div>

          {erro && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 p-3 text-sm"
              style={{
                border: "1px solid var(--brand-accent-red)",
                background: "var(--status-danger-tint)",
                color: "var(--brand-accent-red)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm"
                style={{
                  color: "var(--text-primary)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="Digite seu e-mail"
                className="w-full p-3 text-sm outline-none transition"
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  fontSize: "var(--font-size-base)",
                }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand-primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="mb-1.5 block text-sm"
                style={{
                  color: "var(--text-primary)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  className="w-full p-3 pr-11 text-sm outline-none transition"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontSize: "var(--font-size-base)",
                  }}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = "var(--brand-primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <input
                type="checkbox"
                checked={lembrarAcesso}
                onChange={(e) => setLembrarAcesso(e.target.checked)}
                style={{ accentColor: "var(--brand-primary)" }}
              />
              Lembrar acesso por 30 dias
            </label>

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 flex w-full items-center justify-center gap-2 p-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "var(--brand-primary)",
                color: "#FFFFFF",
                borderRadius: "var(--radius-sm)",
                fontWeight: "var(--font-weight-semibold)",
                border: "none",
                cursor: carregando ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!carregando)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--brand-primary-hover)";
              }}
              onMouseLeave={(e) => {
                if (!carregando)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--brand-primary)";
              }}
            >
              {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
              {carregando ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-center text-xs" style={{ color: "var(--text-secondary)" }}>
              Esqueceu a senha? Peça para o coordenador ou administrador resetar seu acesso.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
