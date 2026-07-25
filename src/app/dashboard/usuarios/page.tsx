"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../../../components/AuthGuard";
import { useUsuarioAtual } from "../../../hooks/useUsuarioAtual";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  role: string;
  escola_id: string | null;
  ativo: boolean;
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
    <main className="min-h-screen bg-zinc-900 p-6 md:p-8 text-white">
      <h1 className="text-2xl font-bold">Usuários</h1>
      <p className="mt-1 text-sm text-zinc-400">
        {capacidades?.viewAllEscolas
          ? "Todos os usuários do sistema."
          : "Usuários da sua escola."}
      </p>

      {erro && (
        <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300">
          {erro}
        </div>
      )}
      {mensagem && (
        <div className="mt-4 rounded-xl border border-green-900/60 bg-green-950/40 p-3 text-sm text-green-300">
          {mensagem}
        </div>
      )}

      <form
        onSubmit={handleCriar}
        className="mt-6 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 sm:grid-cols-4"
      >
        <input
          required
          placeholder="Nome"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm sm:col-span-1"
        />
        <input
          required
          type="email"
          placeholder="E-mail"
          value={novoEmail}
          onChange={(e) => setNovoEmail(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm sm:col-span-1"
        />
        <select
          value={novoRole}
          onChange={(e) => setNovoRole(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm sm:col-span-1"
        >
          <option value="PROFESSOR">Professor</option>
          <option value="LEITOR">Somente leitura</option>
          {capacidades?.viewAllEscolas && <option value="ADMIN_ESCOLA">Coordenador</option>}
        </select>
        <button
          type="submit"
          disabled={criando}
          className="rounded-lg bg-white p-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {criando ? "Criando..." : "Criar usuário"}
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-950/60 text-left text-xs uppercase text-zinc-500">
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
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!carregando &&
              usuarios.map((u) => (
                <tr key={u.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3 font-medium">{u.nome}</td>
                  <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                  <td className="px-4 py-3 text-zinc-400">{u.role}</td>
                  <td className="px-4 py-3">
                    {u.ativo ? (
                      <span className="text-green-400">Ativo</span>
                    ) : (
                      <span className="text-zinc-500">Inativo</span>
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
                          className="w-32 rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-xs"
                        />
                        <button
                          onClick={() => handleResetarSenha(u.id)}
                          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-black"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setResetandoId(null);
                            setNovaSenha("");
                          }}
                          className="text-xs text-zinc-500 hover:text-zinc-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResetandoId(u.id)}
                        className="text-xs font-medium text-zinc-300 hover:text-white"
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
    <AuthGuard allow={["SUPER_ADMIN", "ADMIN_ESCOLA"]}>
      <ConteudoUsuarios />
    </AuthGuard>
  );
}
