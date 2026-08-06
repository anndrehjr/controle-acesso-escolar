"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useUsuarioAtual } from "../../hooks/useUsuarioAtual";
import { dashboardHomeFor, isRole } from "../../types/roles";

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: "var(--font-size-base)",
};

export default function TrocarSenhaPage() {
  const router = useRouter();
  const { usuario } = useUsuarioAtual();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!senhaAtual || !novaSenha) {
      setErro("Preencha a senha atual e a nova senha.");
      return;
    }
    if (novaSenha.length < 8) {
      setErro("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação não bate com a nova senha.");
      return;
    }

    try {
      setCarregando(true);
      const res = await fetch("/api/auth/trocar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Erro ao trocar a senha.");
        return;
      }

      const destino =
        usuario && isRole(usuario.role) ? dashboardHomeFor(usuario.role, usuario.escola_id) : "/dashboard";
      router.replace(destino);
      router.refresh();
    } catch {
      setErro("Erro interno ao trocar a senha. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: "var(--bg-app)" }}>
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="p-8"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-card-hover)",
          }}
        >
          <div className="mb-6 flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center"
              style={{ background: "var(--bg-sidebar-active)", borderRadius: "var(--radius-sm)" }}
            >
              <ShieldCheck className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
            </div>
            <div>
              <h1 className="text-xl" style={{ color: "var(--text-primary)", fontWeight: "var(--font-weight-semibold)" }}>
                Troca de senha obrigatória
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Por segurança, defina uma nova senha antes de continuar. A senha anterior deixará de funcionar.
              </p>
            </div>
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
              <label htmlFor="senhaAtual" className="mb-1.5 block text-sm" style={{ color: "var(--text-primary)", fontWeight: "var(--font-weight-medium)" }}>
                Senha atual
              </label>
              <input
                id="senhaAtual"
                type={mostrar ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Senha temporária recebida"
                className="w-full p-3 text-sm outline-none transition"
                style={inputStyle}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand-primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
              />
            </div>

            <div>
              <label htmlFor="novaSenha" className="mb-1.5 block text-sm" style={{ color: "var(--text-primary)", fontWeight: "var(--font-weight-medium)" }}>
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="novaSenha"
                  type={mostrar ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className="w-full p-3 pr-11 text-sm outline-none transition"
                  style={inputStyle}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = "var(--brand-primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
                />
                <button
                  type="button"
                  onClick={() => setMostrar((v) => !v)}
                  aria-label={mostrar ? "Ocultar senhas" : "Mostrar senhas"}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="mb-1.5 block text-sm" style={{ color: "var(--text-primary)", fontWeight: "var(--font-weight-medium)" }}>
                Confirmar nova senha
              </label>
              <input
                id="confirmarSenha"
                type={mostrar ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                className="w-full p-3 text-sm outline-none transition"
                style={inputStyle}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand-primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 flex w-full items-center justify-center gap-2 p-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "var(--brand-primary-solid)",
                color: "#FFFFFF",
                borderRadius: "var(--radius-sm)",
                fontWeight: "var(--font-weight-semibold)",
                border: "none",
                cursor: carregando ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!carregando) (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-primary-hover)";
              }}
              onMouseLeave={(e) => {
                if (!carregando) (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-primary-solid)";
              }}
            >
              {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
              {carregando ? "Salvando..." : "Salvar nova senha e continuar"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
