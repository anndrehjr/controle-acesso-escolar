"use client";

import { useEffect, useState } from "react";
import { BookOpen, Save } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { rolesWithCapability } from "../../../types/roles";

const ROLES_DIARIO = rolesWithCapability("manageNotas");
type Escola = { id: string; nome: string; ano_letivo: number; bimestre_atual: number };
type Turma = { id: string; nome: string; grupo_pedagogico: string };
type Disciplina = { id: string; nome: string; codigo: string };
type Aluno = { id: string; nome: string; matricula_id: string; numero_chamada: number };
type Nota = { aluno_id: string; nota: number | string };

const field: React.CSSProperties = {
  background: "var(--bg-app)", border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
};

function DiarioConteudo() {
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [escolaId, setEscolaId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());
  const [bimestre, setBimestre] = useState(1);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [originais, setOriginais] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function consultar(params: URLSearchParams) {
    const response = await fetch(`/api/diario?${params}`, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error ?? "Erro ao carregar o diário");
    return json;
  }

  async function carregarEscola(id?: string) {
    setCarregando(true); setErro(null); setMensagem(null);
    try {
      let json = await consultar(new URLSearchParams(id ? { escolaId: id } : {}));
      const listaEscolas = (json.escolas ?? []) as Escola[];
      setEscolas(listaEscolas);
      const selecionada = json.escolaId ?? id ?? listaEscolas[0]?.id ?? "";
      if (!json.escolaId && selecionada) json = await consultar(new URLSearchParams({ escolaId: selecionada }));
      setEscolaId(selecionada);
      setAnoLetivo(Number(json.anoLetivo ?? listaEscolas.find((e) => e.id === selecionada)?.ano_letivo ?? new Date().getFullYear()));
      setBimestre(Number(json.bimestre ?? listaEscolas.find((e) => e.id === selecionada)?.bimestre_atual ?? 1));
      setTurmas(json.turmas ?? []);
      setTurmaId(""); setDisciplinas([]); setDisciplinaId(""); setAlunos([]); setValores({}); setOriginais({});
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro inesperado");
    } finally { setCarregando(false); }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarEscola();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selecionarTurma(id: string) {
    setTurmaId(id); setDisciplinaId(""); setDisciplinas([]); setAlunos([]); setMensagem(null); setErro(null);
    if (!id) return;
    setCarregando(true);
    try {
      const json = await consultar(new URLSearchParams({ escolaId, turmaId: id, anoLetivo: String(anoLetivo), bimestre: String(bimestre) }));
      setDisciplinas(json.disciplinas ?? []);
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setCarregando(false); }
  }

  async function carregarDiario() {
    if (!escolaId || !turmaId || !disciplinaId) return;
    setCarregando(true); setErro(null); setMensagem(null);
    try {
      const json = await consultar(new URLSearchParams({ escolaId, turmaId, disciplinaId, anoLetivo: String(anoLetivo), bimestre: String(bimestre) }));
      const lista = (json.alunos ?? []) as Aluno[];
      const notas = (json.notas ?? []) as Nota[];
      const mapaNotas = new Map(notas.map((nota) => [nota.aluno_id, Number(nota.nota)]));
      setAlunos(lista);
      setOriginais(Object.fromEntries([...mapaNotas.entries()]));
      setValores(Object.fromEntries(lista.map((aluno) => [aluno.id, mapaNotas.has(aluno.id) ? String(mapaNotas.get(aluno.id)) : ""])));
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setCarregando(false); }
  }

  async function salvar() {
    setErro(null); setMensagem(null);
    try {
      const alteracoes = alunos.flatMap((aluno) => {
        const texto = valores[aluno.id]?.trim() ?? "";
        if (!texto) return [];
        const nota = Number(texto.replace(",", "."));
        if (!Number.isFinite(nota) || nota < 0 || nota > 10) throw new Error(`Nota inválida para ${aluno.nome}`);
        if (originais[aluno.id] === nota) return [];
        return [{ alunoId: aluno.id, disciplinaId, turmaId, bimestre, anoLetivo, nota }];
      });
      if (alteracoes.length === 0) { setMensagem("Nenhuma alteração para salvar."); return; }
      setSalvando(true);
      const response = await fetch("/api/notas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escolaId, notas: alteracoes }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Erro ao salvar notas");
      await carregarDiario();
      setMensagem(`${json.resumo.sucesso} nota(s) salva(s) com auditoria no lote ${json.batchId}.`);
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setSalvando(false); }
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3"><BookOpen className="h-6 w-6" style={{ color: "var(--brand-primary)" }} /><div><h1 className="text-2xl font-bold">Diário de classe</h1><p className="text-sm" style={{ color: "var(--text-secondary)" }}>Lançamento por turma, disciplina, bimestre e matrícula anual.</p></div></div>

      {(erro || mensagem) && <div className="mt-4 p-3 text-sm" style={{ ...field, color: erro ? "var(--status-danger-bg)" : "var(--status-success-bg)" }}>{erro ?? mensagem}</div>}

      <div className="mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" style={{ ...field, background: "var(--bg-card)" }}>
        <StyledSelect value={escolaId} onChange={(e) => void carregarEscola(e.target.value)} className="p-2 text-sm" style={field} disabled={escolas.length <= 1}>{escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</StyledSelect>
        <StyledSelect value={turmaId} onChange={(e) => void selecionarTurma(e.target.value)} className="p-2 text-sm" style={field}><option value="">Turma</option>{turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</StyledSelect>
        <StyledSelect value={disciplinaId} onChange={(e) => { setDisciplinaId(e.target.value); setAlunos([]); }} className="p-2 text-sm" style={field}><option value="">Disciplina</option>{disciplinas.map((d) => <option key={d.id} value={d.id}>{d.codigo} · {d.nome}</option>)}</StyledSelect>
        <input type="number" min={2000} max={2100} value={anoLetivo} onChange={(e) => setAnoLetivo(Number(e.target.value))} className="p-2 text-sm" style={field} aria-label="Ano letivo" />
        <StyledSelect value={bimestre} onChange={(e) => setBimestre(Number(e.target.value))} className="p-2 text-sm" style={field}>{[1,2,3,4].map((b) => <option key={b} value={b}>{b}º bimestre</option>)}</StyledSelect>
        <button onClick={() => void carregarDiario()} disabled={carregando || !disciplinaId} className="p-2 text-sm font-semibold disabled:opacity-50" style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary-solid)", color: "var(--status-text-on-color)" }}>{carregando ? "Carregando..." : "Carregar"}</button>
      </div>

      <div className="mt-6 overflow-x-auto" style={{ ...field, background: "var(--bg-card)" }}>
        <table className="w-full min-w-[560px] text-sm"><thead style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}><tr><th className="px-4 py-3 text-left">Nº</th><th className="px-4 py-3 text-left">Aluno</th><th className="px-4 py-3 text-left">Nota</th></tr></thead>
          <tbody>{alunos.map((aluno) => <tr key={aluno.matricula_id} style={{ borderTop: "1px solid var(--border-subtle)" }}><td className="px-4 py-3">{aluno.numero_chamada}</td><td className="px-4 py-3 font-medium">{aluno.nome}</td><td className="px-4 py-2"><input inputMode="decimal" value={valores[aluno.id] ?? ""} onChange={(e) => setValores((atual) => ({ ...atual, [aluno.id]: e.target.value }))} className="w-24 p-2" style={field} aria-label={`Nota de ${aluno.nome}`} /></td></tr>)}</tbody>
        </table>
        {!carregando && disciplinaId && alunos.length === 0 && <p className="p-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>Nenhuma matrícula ativa encontrada para este ano.</p>}
      </div>
      {alunos.length > 0 && <div className="mt-4 flex justify-end"><button onClick={() => void salvar()} disabled={salvando} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary-solid)", color: "var(--status-text-on-color)" }}><Save className="h-4 w-4" />{salvando ? "Salvando..." : "Salvar alterações"}</button></div>}
    </main>
  );
}

export default function DiarioPage() {
  return <AuthGuard allow={ROLES_DIARIO}><DiarioConteudo /></AuthGuard>;
}

