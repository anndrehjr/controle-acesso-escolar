"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { useUsuarioAtual } from "../../../hooks/useUsuarioAtual";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  role: string;
  escola_id: string | null;
  ativo: boolean;
};

const inputStyle: React.CSSProperties = {
  background: "var(--bg-app)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
};

function ConteudoUsuarios() {
  const { usuario, capacidades } = useUsuarioAtual();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoRole, setNovoRole] = useState("PROFESSOR");
  const [criando, setCriando] = useState(false);

  const [resetandoId, setResetandoId] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/usuarios");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar usuários");
      setUsuarios(json.data ?? []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // Carga inicial ao montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    setCriando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoNome,
          email: novoEmail,
          role: novoRole,
          escolaId: usuario?.escola_id ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar usuário");
      setMensagem("Usuário criado. Defina uma senha inicial para ele poder entrar.");
      setNovoNome("");
      setNovoEmail("");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setCriando(false);
    }
  }

  async function handleResetarSenha(id: string) {
    setErro(null);
    setMensagem(null);
    if (novaSenha.length < 8) {
      setErro("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    try {
      const res = await fetch(`/api/usuarios/${id}/resetar-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novaSenha }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao redefinir senha");
      setMensagem("Senha redefinida com sucesso.");
      setResetandoId(null);
      setNovaSenha("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <h1 className="text-2xl font-bold">Usuários</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        {capacidades?.viewAllEscolas
          ? "Todos os usuários do sistema."
          : "Usuários da sua escola."}
      </p>

      {erro && (
        <div
          className="mt-4 p-3 text-sm"
          style={{
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--status-danger-bg)",
            background: "var(--status-danger-tint)",
            color: "var(--status-danger-bg)",
          }}
        >
          {erro}
        </div>
      )}
      {mensagem && (
        <div
          className="mt-4 p-3 text-sm"
          style={{
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--status-success-bg)",
            background: "var(--status-success-tint)",
            color: "var(--status-success-bg)",
          }}
        >
          {mensagem}
        </div>
      )}

      <form
        onSubmit={handleCriar}
        className="mt-6 grid gap-3 p-5 sm:grid-cols-4"
        style={{
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <input
          required
          placeholder="Nome"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          className="p-2 text-sm outline-none transition sm:col-span-1"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.boxShadow = "var(--focus-ring)")}
          onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
        />
        <input
          required
          type="email"
          placeholder="E-mail"
          value={novoEmail}
          onChange={(e) => setNovoEmail(e.target.value)}
          className="p-2 text-sm outline-none transition sm:col-span-1"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.boxShadow = "var(--focus-ring)")}
          onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
        />
        <StyledSelect
          value={novoRole}
          onChange={(e) => setNovoRole(e.target.value)}
          className="p-2 text-sm sm:col-span-1"
          style={inputStyle}
        >
          <option value="PROFESSOR">Professor</option>
          <option value="LEITOR">Somente leitura</option>
          {capacidades?.viewAllEscolas && <option value="ADMIN_ESCOLA">Coordenador</option>}
        </StyledSelect>
        <button
          type="submit"
          disabled={criando}
          className="p-2 text-sm font-semibold transition disabled:opacity-50"
          style={{
            borderRadius: "var(--radius-sm)",
            background: "var(--brand-primary)",
            color: "var(--status-text-on-color)",
          }}
          onMouseEnter={(e) => {
            if (!criando) (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-primary-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-primary)";
          }}
        >
          {criando ? "Criando..." : "Criar usuário"}
        </button>
      </form>

      <div
        className="mt-6 overflow-x-auto"
        style={{
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <table className="w-full min-w-[640px] text-sm">
          <thead
            className="text-left text-xs uppercase tracking-wide"
            style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}
          >
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center" style={{ color: "var(--text-secondary)" }}>
                  Carregando...
                </td>
              </tr>
            )}
            {!carregando && usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center" style={{ color: "var(--text-secondary)" }}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {!carregando &&
              usuarios.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td className="px-4 py-3 font-medium">{u.nome}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{u.role}</td>
                  <td className="px-4 py-3">
                    {u.ativo ? (
                      <span style={{ color: "var(--status-success-bg)" }}>Ativo</span>
                    ) : (
                      <span style={{ color: "var(--text-secondary)" }}>Inativo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {resetandoId === u.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="password"
                          placeholder="Nova senha"
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                          className="w-32 p-1.5 text-xs outline-none"
                          style={inputStyle}
                        />
                        <button
                          onClick={() => handleResetarSenha(u.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold transition"
                          style={{
                            borderRadius: "var(--radius-sm)",
                            background: "var(--brand-primary)",
                            color: "var(--status-text-on-color)",
                          }}
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setResetandoId(null);
                            setNovaSenha("");
                          }}
                          className="text-xs transition"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResetandoId(u.id)}
                        className="text-xs font-medium transition"
                        style={{ color: "var(--text-link)" }}
                      >
                        Redefinir senha
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default function UsuariosPage() {
  return (
    <AuthGuard allow={["SUPER_ADMIN"]}>
      <ConteudoUsuarios />
    </AuthGuard>
  );
}
