"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, UserRoundCheck } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { rolesWithCapability } from "../../../types/roles";

const ROLES_GESTAO = rolesWithCapability("manageUsuarios");
type Escola = { id: string; nome: string };
type Professor = { id: string; nome: string; email: string };
type Turma = { id: string; nome: string; grupo_pedagogico: string };
type Disciplina = { id: string; nome: string; grupo_pedagogico: string };
type Vinculo = { id: string; professor_id: string; professor_nome: string; turma_id: string; turma_nome: string; disciplina_id: string | null; disciplina_nome: string | null; ativo: boolean };

const field: React.CSSProperties = {
  background: "var(--bg-app)", border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
};

function VinculosConteudo() {
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [escolaId, setEscolaId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const turma = turmas.find((item) => item.id === turmaId);
  const disciplinasDaTurma = useMemo(
    () => disciplinas.filter((item) => !turma || item.grupo_pedagogico === turma.grupo_pedagogico),
    [disciplinas, turma],
  );

  async function carregar(id?: string, preservarMensagem = false) {
    setCarregando(true); setErro(null); if (!preservarMensagem) setMensagem(null);
    try {
      let response = await fetch(`/api/professor-vinculos${id ? `?escolaId=${id}` : ""}`, { cache: "no-store" });
      let json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Erro ao carregar vínculos");
      const listaEscolas = (json.escolas ?? []) as Escola[];
      const selecionada = json.escolaId ?? id ?? listaEscolas[0]?.id ?? "";
      if (!json.escolaId && selecionada) {
        response = await fetch(`/api/professor-vinculos?escolaId=${selecionada}`, { cache: "no-store" });
        json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "Erro ao carregar vínculos");
      }
      setEscolas(listaEscolas); setEscolaId(selecionada);
      setProfessores(json.professores ?? []); setTurmas(json.turmas ?? []);
      setDisciplinas(json.disciplinas ?? []); setVinculos(json.vinculos ?? []);
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setCarregando(false); }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, []);

  async function criar(event: React.FormEvent) {
    event.preventDefault(); setSalvando(true); setErro(null); setMensagem(null);
    try {
      const response = await fetch("/api/professor-vinculos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escolaId, professorId, turmaId, disciplinaId: disciplinaId || null }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Erro ao criar vínculo");
      setMensagem("Vínculo criado e registrado na auditoria.");
      setProfessorId(""); setTurmaId(""); setDisciplinaId("");
      await carregar(escolaId, true);
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setSalvando(false); }
  }

  async function desativar(id: string) {
    setErro(null); setMensagem(null);
    try {
      const response = await fetch("/api/professor-vinculos", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ escolaId, id }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Erro ao remover vínculo");
      setMensagem("Vínculo desativado e registrado na auditoria.");
      await carregar(escolaId, true);
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3"><UserRoundCheck className="h-6 w-6" style={{ color: "var(--brand-primary)" }} /><div><h1 className="text-2xl font-bold">Vínculos de professores</h1><p className="text-sm" style={{ color: "var(--text-secondary)" }}>Defina quais turmas e disciplinas aparecem no diário de cada professor.</p></div></div>
      {(erro || mensagem) && <div className="mt-4 p-3 text-sm" style={{ ...field, color: erro ? "var(--status-danger-bg)" : "var(--status-success-bg)" }}>{erro ?? mensagem}</div>}

      <form onSubmit={criar} className="mt-6 grid gap-3 p-4 md:grid-cols-5" style={{ ...field, background: "var(--bg-card)" }}>
        <StyledSelect value={escolaId} onChange={(e) => void carregar(e.target.value)} disabled={escolas.length <= 1} className="p-2 text-sm" style={field}>{escolas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</StyledSelect>
        <StyledSelect required value={professorId} onChange={(e) => setProfessorId(e.target.value)} className="p-2 text-sm" style={field}><option value="">Professor</option>{professores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</StyledSelect>
        <StyledSelect required value={turmaId} onChange={(e) => { setTurmaId(e.target.value); setDisciplinaId(""); }} className="p-2 text-sm" style={field}><option value="">Turma</option>{turmas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</StyledSelect>
        <StyledSelect value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} className="p-2 text-sm" style={field}><option value="">Todas as disciplinas</option>{disciplinasDaTurma.map((item) => <option key={`${item.grupo_pedagogico}:${item.id}`} value={item.id}>{item.nome}</option>)}</StyledSelect>
        <button type="submit" disabled={salvando || !professorId || !turmaId} className="flex items-center justify-center gap-2 p-2 text-sm font-semibold disabled:opacity-50" style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary-solid)", color: "var(--status-text-on-color)" }}><Link2 className="h-4 w-4" />{salvando ? "Salvando..." : "Criar vínculo"}</button>
      </form>
      {professores.length === 0 && !carregando && <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>Ainda não há usuários com papel PROFESSOR nesta escola. Cadastre o professor na tela Usuários antes de criar o vínculo.</p>}

      <div className="mt-6 overflow-x-auto" style={{ ...field, background: "var(--bg-card)" }}><table className="w-full min-w-[720px] text-sm"><thead style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}><tr><th className="px-4 py-3 text-left">Professor</th><th className="px-4 py-3 text-left">Turma</th><th className="px-4 py-3 text-left">Disciplina</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3" /></tr></thead>
        <tbody>{vinculos.map((item) => <tr key={item.id} style={{ borderTop: "1px solid var(--border-subtle)" }}><td className="px-4 py-3 font-medium">{item.professor_nome}</td><td className="px-4 py-3">{item.turma_nome}</td><td className="px-4 py-3">{item.disciplina_nome ?? "Todas as disciplinas"}</td><td className="px-4 py-3" style={{ color: item.ativo ? "var(--status-success-bg)" : "var(--text-secondary)" }}>{item.ativo ? "Ativo" : "Inativo"}</td><td className="px-4 py-3 text-right">{item.ativo && <button onClick={() => void desativar(item.id)} className="text-xs font-semibold" style={{ color: "var(--status-danger-bg)" }}>Desativar</button>}</td></tr>)}</tbody>
      </table>{!carregando && vinculos.length === 0 && <p className="p-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>Nenhum vínculo cadastrado.</p>}</div>
    </main>
  );
}

export default function VinculosProfessoresPage() {
  return <AuthGuard allow={ROLES_GESTAO}><VinculosConteudo /></AuthGuard>;
}
