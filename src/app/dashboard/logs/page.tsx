"use client";

import { Fragment, useEffect, useState } from "react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { rolesWithCapability } from "../../../types/roles";

const ROLES_AUDITORIA = rolesWithCapability("viewAuditLogs");

type LogEntry = {
  id: string;
  usuario_email: string | null;
  role: string | null;
  escola_id: string | null;
  acao: string;
  tabela: string | null;
  registro_id: string | null;
  tela: string | null;
  ip: string | null;
  user_agent: string | null;
  dados_anteriores: unknown;
  dados_novos: unknown;
  sucesso: boolean;
  created_at: string;
};

const inputStyle: React.CSSProperties = {
  background: "var(--bg-app)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
};

function JsonAuditoria({ titulo, valor }: { titulo: string; valor: unknown }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{titulo}</h3>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words p-3 text-xs" style={inputStyle}>
        {valor === null || valor === undefined ? "Sem valor registrado" : JSON.stringify(valor, null, 2)}
      </pre>
    </section>
  );
}

function ConteudoLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("");
  const [filtroTabela, setFiltroTabela] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (filtroUsuario) params.set("usuario", filtroUsuario);
      if (filtroAcao) params.set("acao", filtroAcao);
      if (filtroTabela) params.set("tabela", filtroTabela);
      const res = await fetch(`/api/logs?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar auditoria");
      setLogs(json.data ?? []);
      setAberto(null);
    } catch (error) {
      setLogs([]);
      setErro(error instanceof Error ? error.message : "Erro ao carregar auditoria");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <h1 className="text-2xl font-bold">Logs de auditoria</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Consulte quem alterou cada registro e compare os valores anteriores e novos.
      </p>

      <form onSubmit={(event) => { event.preventDefault(); void carregar(); }} className="mt-6 flex flex-wrap gap-3">
        <input placeholder="Filtrar por e-mail" value={filtroUsuario} onChange={(event) => setFiltroUsuario(event.target.value)}
          className="p-2 text-sm outline-none" style={inputStyle} />
        <StyledSelect value={filtroAcao} onChange={(event) => setFiltroAcao(event.target.value)} className="p-2 text-sm" style={inputStyle}>
          <option value="">Todas as ações</option>
          <option value="NOTA_EDITADA">Nota editada</option>
          <option value="NOTA_RECALCULADA_AVALIACOES">Nota recalculada por avaliações</option>
          <option value="NOTA_ATUALIZADA_RECUPERACAO">Nota atualizada por recuperação</option>
          <option value="AVALIACAO_CRIADA">Avaliação criada</option>
          <option value="RESULTADO_AVALIACAO_EDITADO">Resultado de avaliação editado</option>
          <option value="RECUPERACAO_APLICADA">Recuperação aplicada</option>
          <option value="USUARIO_CRIADO">Usuário criado</option>
          <option value="SENHA_REDEFINIDA">Senha redefinida</option>
          <option value="LOGIN_SUCESSO">Login com sucesso</option>
          <option value="LOGIN_FALHA">Login com falha</option>
        </StyledSelect>
        <input placeholder="Tabela, ex.: notas" value={filtroTabela} onChange={(event) => setFiltroTabela(event.target.value)}
          className="p-2 text-sm outline-none" style={inputStyle} />
        <button type="submit" className="px-4 py-2 text-sm font-semibold"
          style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary-solid)", color: "var(--status-text-on-color)" }}>
          Filtrar
        </button>
      </form>

      {erro && <p className="mt-4 p-3 text-sm" style={{ ...inputStyle, color: "var(--status-danger-bg)" }}>{erro}</p>}

      <div className="mt-6 overflow-x-auto" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
        <table className="w-full min-w-[860px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide" style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}>
            <tr>
              <th className="px-4 py-3">Quando</th><th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Ação</th><th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3">Valores</th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={6} className="px-4 py-6 text-center" style={{ color: "var(--text-secondary)" }}>Carregando...</td></tr>}
            {!carregando && logs.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center" style={{ color: "var(--text-secondary)" }}>Nenhum registro encontrado.</td></tr>}
            {!carregando && logs.map((log) => (
              <Fragment key={log.id}>
                <tr style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{new Date(log.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3"><div>{log.usuario_email ?? "-"}</div><div className="text-xs" style={{ color: "var(--text-secondary)" }}>{log.role ?? "-"}</div></td>
                  <td className="px-4 py-3 font-medium">{log.acao}</td>
                  <td className="px-4 py-3"><div>{log.tabela ?? "-"}</div><div className="max-w-44 truncate text-xs" title={log.registro_id ?? ""} style={{ color: "var(--text-secondary)" }}>{log.registro_id ?? "-"}</div></td>
                  <td className="px-4 py-3" style={{ color: log.sucesso ? "var(--status-success-bg)" : "var(--status-danger-bg)" }}>{log.sucesso ? "OK" : "Falha"}</td>
                  <td className="px-4 py-3">
                    <button type="button" aria-expanded={aberto === log.id} onClick={() => setAberto(aberto === log.id ? null : log.id)}
                      className="px-3 py-1 text-xs font-semibold" style={inputStyle}>
                      {aberto === log.id ? "Ocultar" : "Comparar"}
                    </button>
                  </td>
                </tr>
                {aberto === log.id && (
                  <tr style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-app)" }}>
                    <td colSpan={6} className="p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <JsonAuditoria titulo="Valor anterior" valor={log.dados_anteriores} />
                        <JsonAuditoria titulo="Valor novo" valor={log.dados_novos} />
                      </div>
                      <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                        Tela: {log.tela ?? "-"} · IP: {log.ip ?? "-"}
                      </p>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default function LogsPage() {
  return <AuthGuard allow={ROLES_AUDITORIA}><ConteudoLogs /></AuthGuard>;
}
