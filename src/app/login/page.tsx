"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../services/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    try {
      setCarregando(true);

      const { usuario } = await login(email, senha);

      if (usuario.role === "SUPER_ADMIN") {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if (usuario.role === "ADMIN_ESCOLA") {
        router.replace(`/dashboard/escolas/${usuario.escola_id}`);
        router.refresh();
        return;
      }

      alert("Usuário sem permissão configurada");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro interno ao realizar login";
      alert(message);
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
        <div
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

          <div className="space-y-4">
            <div>
              <label
                className="mb-1.5 block text-sm"
                style={{
                  color: "var(--text-primary)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                E-mail
              </label>
              <input
                type="email"
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
                className="mb-1.5 block text-sm"
                style={{
                  color: "var(--text-primary)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                Senha
              </label>
              <input
                type="password"
                placeholder="Digite sua senha"
                className="w-full p-3 text-sm outline-none transition"
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
            </div>

            <button
              onClick={handleLogin}
              disabled={carregando}
              className="mt-2 w-full p-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
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
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
