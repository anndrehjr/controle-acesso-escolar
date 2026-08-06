"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";

type LogEntry = {
  id: string;
  usuario_email: string | null;
  role: string | null;
  escola_id: string | null;
  acao: string;
  tela: string | null;
  ip: string | null;
  user_agent: string | null;
  sucesso: boolean;
  created_at: string;
};

const inputStyle: React.CSSProperties = {
  background: "var(--bg-app)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
};

function ConteudoLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("");

  async function carregar() {
    setCarregando(true);
    const params = new URLSearchParams();
    if (filtroUsuario) params.set("usuario", filtroUsuario);
    if (filtroAcao) params.set("acao", filtroAcao);
    const res = await fetch(`/api/logs?${params}`);
    const json = await res.json();
    setLogs(res.ok ? json.data ?? [] : []);
    setCarregando(false);
  }

  useEffect(() => {
    // Carga inicial ao montar; recargas seguintes acontecem via submit do filtro.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <h1 className="text-2xl font-bold">Logs de auditoria</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Login, logout e alterações de usuários registradas no sistema.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          carregar();
        }}
        className="mt-6 flex flex-wrap gap-3"
      >
        <input
          placeholder="Filtrar por e-mail"
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario(e.target.value)}
          className="p-2 text-sm outline-none transition"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.boxShadow = "var(--focus-ring)")}
          onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
        />
        <StyledSelect
          value={filtroAcao}
          onChange={(e) => setFiltroAcao(e.target.value)}
          className="p-2 text-sm"
          style={inputStyle}
        >
          <option value="">Todas as ações</option>
          <option value="LOGIN_SUCESSO">Login com sucesso</option>
          <option value="LOGIN_FALHA">Login com falha</option>
          <option value="LOGIN_BLOQUEADO">Login bloqueado</option>
          <option value="LOGOUT">Logout</option>
          <option value="USUARIO_CRIADO">Usuário criado</option>
          <option value="SENHA_REDEFINIDA">Senha redefinida</option>
        </StyledSelect>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold transition"
          style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary)", color: "var(--status-text-on-color)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--brand-primary-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--brand-primary)")}
        >
          Filtrar
        </button>
      </form>

      <div
        className="mt-6 overflow-x-auto"
        style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}
      >
        <table className="w-full min-w-[720px] text-sm">
          <thead
            className="text-left text-xs uppercase tracking-wide"
            style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}
          >
            <tr>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center" style={{ color: "var(--text-secondary)" }}>
                  Carregando...
                </td>
              </tr>
            )}
            {!carregando && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center" style={{ color: "var(--text-secondary)" }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {!carregando &&
              logs.map((log) => (
                <tr key={log.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">{log.usuario_email ?? "-"}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{log.role ?? "-"}</td>
                  <td className="px-4 py-3 font-medium">{log.acao}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{log.ip ?? "-"}</td>
                  <td className="px-4 py-3">
                    {log.sucesso ? (
                      <span style={{ color: "var(--status-success-bg)" }}>OK</span>
                    ) : (
                      <span style={{ color: "var(--status-danger-bg)" }}>Falha</span>
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

export default function LogsPage() {
  return (
    <AuthGuard allow={["SUPER_ADMIN"]}>
      <ConteudoLogs />
    </AuthGuard>
  );
}
