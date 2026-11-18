"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Search, UserMinus, UserPlus, X } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { useUsuarioAtual } from "../../../hooks/useUsuarioAtual";
import { rolesWithCapability } from "../../../types/roles";

const ROLES_GESTAO = rolesWithCapability("manageUsuarios");

type Turma = { id: string; nome: string; ano_serie: number };
type Aluno = {
  id: string; nome: string; turma_id: string; turma_nome: string; numero_chamada: number;
  status: string; ativo: boolean; matricula_status: string | null; ano_letivo: number | null;
  data_inicio: string | null; data_fim: string | null; motivo_fim: string | null;
};
type Dados = { escola: { id: string; nome: string }; anoLetivo: number; turmas: Turma[]; alunos: Aluno[] };

const field: React.CSSProperties = {
  background: "var(--bg-app)", border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
};

function csrfToken(): string {
  return document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)?.[1] ?? "";
}

function Conteudo() {
  const { usuario } = useUsuarioAtual();
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [nome, setNome] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [numeroChamada, setNumeroChamada] = useState("");
  const [saida, setSaida] = useState<Aluno | null>(null);
  const [tipoSaida, setTipoSaida] = useState<"TRANSFERENCIA" | "INATIVACAO">("TRANSFERENCIA");
  const [motivoSaida, setMotivoSaida] = useState("");
  const [erroSaida, setErroSaida] = useState<string | null>(null);

  async function carregar() {
    if (!usuario?.escola_id) return;
    setCarregando(true); setErro(null);
    try {
      const res = await fetch(`/api/alunos?escolaId=${usuario.escola_id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar alunos");
      setDados(json);
      setTurmaId((atual) => atual || json.turmas?.[0]?.id || "");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro inesperado");
    } finally { setCarregando(false); }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (usuario?.escola_id) void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.escola_id]);

  const alunosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return (dados?.alunos ?? []).filter((aluno) => {
      if (!mostrarInativos && !aluno.ativo) return false;
      if (filtroTurma && aluno.turma_id !== filtroTurma) return false;
      return !termo || aluno.nome.toLocaleLowerCase("pt-BR").includes(termo) || String(aluno.numero_chamada) === termo;
    });
  }, [dados, busca, filtroTurma, mostrarInativos]);

  async function cadastrar(event: React.FormEvent) {
    event.preventDefault(); setErro(null); setMensagem(null); setSalvando(true);
    try {
      const res = await fetch("/api/alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken() },
        body: JSON.stringify({ escolaId: usuario?.escola_id, nome, turmaId, numeroChamada: Number(numeroChamada), anoLetivo: dados?.anoLetivo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao cadastrar aluno");
      setNome(""); setNumeroChamada("");
      setMensagem(`${json.aluno.nome} foi cadastrado(a) e matriculado(a) com sucesso.`);
      await carregar();
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setSalvando(false); }
  }

  async function registrarSaida() {
    if (!saida) return;
    if (motivoSaida.trim().length < 3) {
      setErroSaida("Escreva um motivo com pelo menos 3 caracteres.");
      return;
    }
    setErroSaida(null);
    setErro(null); setMensagem(null); setSalvando(true);
    try {
      const res = await fetch(`/api/alunos/${saida.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken() },
        body: JSON.stringify({ tipo: tipoSaida, motivo: motivoSaida }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao registrar saída");
      setMensagem(tipoSaida === "TRANSFERENCIA" ? `Transferência de ${saida.nome} registrada.` : `${saida.nome} foi inativado(a).`);
      setSaida(null); setMotivoSaida(""); setTipoSaida("TRANSFERENCIA"); setErroSaida(null);
      await carregar();
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setSalvando(false); }
  }

  if (usuario && !usuario.escola_id) {
    return <main className="min-h-screen p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>Selecione uma escola antes de gerenciar alunos.</main>;
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl p-3" style={{ background: "var(--bg-sidebar-active)", color: "var(--brand-primary)" }}><GraduationCap className="h-6 w-6" /></div>
          <div><h1 className="text-2xl font-black">Gestão de alunos</h1><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{dados?.escola.nome ?? "Escola"} · Ano letivo {dados?.anoLetivo ?? ""}</p></div>
        </div>
        <div className="rounded-2xl border px-4 py-3 text-right" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}>
          <p className="text-2xl font-black">{dados?.alunos.filter((aluno) => aluno.ativo).length ?? 0}</p><p className="text-xs" style={{ color: "var(--text-secondary)" }}>alunos ativos</p>
        </div>
      </div>

      {(erro || mensagem) && <div className="mt-5 rounded-xl border p-3 text-sm" style={{ borderColor: erro ? "var(--status-danger-bg)" : "var(--status-success-bg)", background: erro ? "var(--status-danger-tint)" : "var(--status-success-tint)", color: erro ? "var(--status-danger-bg)" : "var(--status-success-bg)" }}>{erro ?? mensagem}</div>}

      <form onSubmit={cadastrar} className="mt-6 rounded-3xl border p-5 md:p-6" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
        <div className="mb-4 flex items-center gap-2"><UserPlus className="h-5 w-5" style={{ color: "var(--brand-primary)" }} /><h2 className="text-lg font-bold">Adicionar novo aluno</h2></div>
        <div className="grid gap-3 md:grid-cols-[2fr_1.2fr_0.7fr_auto]">
          <label className="grid gap-1 text-sm"><span>Nome completo</span><input required minLength={3} value={nome} onChange={(e) => setNome(e.target.value)} className="p-2.5 outline-none" style={field} placeholder="Nome do aluno" /></label>
          <label className="grid gap-1 text-sm"><span>Turma</span><StyledSelect required value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="p-2.5" style={field}><option value="">Selecione</option>{dados?.turmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</StyledSelect></label>
          <label className="grid gap-1 text-sm"><span>Nº de chamada</span><input required type="number" min={1} max={999} value={numeroChamada} onChange={(e) => setNumeroChamada(e.target.value)} className="p-2.5 outline-none" style={field} /></label>
          <button type="submit" disabled={salvando || carregando} className="self-end rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50" style={{ background: "var(--brand-primary-solid)", color: "var(--status-text-on-color)" }}>{salvando ? "Salvando..." : "Cadastrar"}</button>
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>O cadastro cria automaticamente a matrícula de {dados?.anoLetivo ?? "2026"}. O número de chamada deve estar livre na turma.</p>
      </form>

      <section className="mt-6 overflow-hidden rounded-3xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
        <div className="grid gap-3 border-b p-4 md:grid-cols-[1fr_220px_auto]" style={{ borderColor: "var(--border-subtle)" }}>
          <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: "var(--text-secondary)" }} /><input value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full py-2 pl-9 pr-3 text-sm outline-none" style={field} placeholder="Buscar por nome ou chamada" /></label>
          <StyledSelect value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)} className="p-2 text-sm" style={field}><option value="">Todas as turmas</option>{dados?.turmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</StyledSelect>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mostrarInativos} onChange={(e) => setMostrarInativos(e.target.checked)} /> Mostrar alunos que saíram</label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm"><thead style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}><tr><th className="px-4 py-3 text-left">Chamada</th><th className="px-4 py-3 text-left">Aluno</th><th className="px-4 py-3 text-left">Turma</th><th className="px-4 py-3 text-left">Situação</th><th className="px-4 py-3 text-right">Ação</th></tr></thead>
            <tbody>
              {carregando && <tr><td colSpan={5} className="p-8 text-center" style={{ color: "var(--text-secondary)" }}>Carregando...</td></tr>}
              {!carregando && alunosFiltrados.length === 0 && <tr><td colSpan={5} className="p-8 text-center" style={{ color: "var(--text-secondary)" }}>Nenhum aluno encontrado.</td></tr>}
              {!carregando && alunosFiltrados.map((aluno) => <tr key={aluno.id} style={{ borderTop: "1px solid var(--border-subtle)" }}><td className="px-4 py-3 font-bold">{aluno.numero_chamada}</td><td className="px-4 py-3 font-semibold">{aluno.nome}</td><td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{aluno.turma_nome}</td><td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: aluno.ativo ? "var(--status-success-tint)" : "var(--bg-app)", color: aluno.ativo ? "var(--status-success-bg)" : "var(--text-secondary)" }}>{aluno.ativo ? "Ativo" : aluno.status === "TRANSFERIDO" ? "Transferido" : "Inativo"}</span></td><td className="px-4 py-3 text-right">{aluno.ativo && <button onClick={() => { setSaida(aluno); setMotivoSaida(""); setErroSaida(null); }} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "var(--status-danger-bg)", color: "var(--status-danger-bg)" }}><UserMinus className="h-3.5 w-3.5" /> Registrar saída</button>}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {saida && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !salvando && setSaida(null)}><div className="w-full max-w-lg rounded-3xl border p-6 shadow-2xl" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }} onClick={(e) => e.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">Registrar saída</h2><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{saida.nome} · {saida.turma_nome}</p></div><button onClick={() => setSaida(null)} disabled={salvando} aria-label="Fechar"><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-4"><label className="grid gap-1 text-sm"><span>Tipo de saída</span><StyledSelect value={tipoSaida} onChange={(e) => setTipoSaida(e.target.value as "TRANSFERENCIA" | "INATIVACAO")} className="p-2.5" style={field}><option value="TRANSFERENCIA">Transferência para outra escola</option><option value="INATIVACAO">Inativação / abandono</option></StyledSelect></label><label className="grid gap-1 text-sm"><span>Motivo</span><textarea required minLength={3} maxLength={300} value={motivoSaida} onChange={(e) => { setMotivoSaida(e.target.value); if (e.target.value.trim().length >= 3) setErroSaida(null); }} className="min-h-24 p-2.5 outline-none" style={{ ...field, borderColor: erroSaida ? "var(--status-danger-bg)" : "var(--border-subtle)" }} placeholder="Informe o motivo da saída" /><span className="flex justify-between text-xs" style={{ color: erroSaida ? "var(--status-danger-bg)" : "var(--text-secondary)" }}><span>{erroSaida ?? "Mínimo de 3 caracteres."}</span><span>{motivoSaida.length}/300</span></span></label><div className="aviso-ambar rounded-xl border p-3 text-sm" style={{ borderColor: "var(--status-warning-bg)", background: "var(--status-warning-tint)" }}>As notas e o histórico serão preservados. O aluno deixará de aparecer nas listas de alunos ativos.</div><div className="flex justify-end gap-3"><button onClick={() => setSaida(null)} disabled={salvando} className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: "var(--border-subtle)" }}>Cancelar</button><button onClick={() => void registrarSaida()} disabled={salvando} className="rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50" style={{ background: "var(--status-danger-bg)", color: "white" }}>{salvando ? "Salvando..." : "Confirmar saída"}</button></div></div></div></div>}
    </main>
  );
}

export default function GestaoAlunosPage() {
  return <AuthGuard allow={ROLES_GESTAO}><Conteudo /></AuthGuard>;
}
