"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../../../components/AuthGuard";

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
    <main className="min-h-screen bg-zinc-900 p-6 md:p-8 text-white">
      <h1 className="text-2xl font-bold">Logs de auditoria</h1>
      <p className="mt-1 text-sm text-zinc-400">Login, logout e alterações de usuários registradas no sistema.</p>

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
          className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm"
        />
        <select
          value={filtroAcao}
          onChange={(e) => setFiltroAcao(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm"
        >
          <option value="">Todas as ações</option>
          <option value="LOGIN_SUCESSO">Login com sucesso</option>
          <option value="LOGIN_FALHA">Login com falha</option>
          <option value="LOGIN_BLOQUEADO">Login bloqueado</option>
          <option value="LOGOUT">Logout</option>
          <option value="USUARIO_CRIADO">Usuário criado</option>
          <option value="SENHA_REDEFINIDA">Senha redefinida</option>
        </select>
        <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black">
          Filtrar
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-zinc-950/60 text-left text-xs uppercase text-zinc-500">
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
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!carregando && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {!carregando &&
              logs.map((log) => (
                <tr key={log.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">{log.usuario_email ?? "-"}</td>
                  <td className="px-4 py-3 text-zinc-400">{log.role ?? "-"}</td>
                  <td className="px-4 py-3 font-medium">{log.acao}</td>
                  <td className="px-4 py-3 text-zinc-400">{log.ip ?? "-"}</td>
                  <td className="px-4 py-3">
                    {log.sucesso ? (
                      <span className="text-green-400">OK</span>
                    ) : (
                      <span className="text-red-400">Falha</span>
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
