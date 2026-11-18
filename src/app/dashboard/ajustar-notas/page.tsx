"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Save, Search, ShieldCheck } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { useUsuarioAtual } from "../../../hooks/useUsuarioAtual";

type Escola = { id: string; nome: string; ano_letivo: number };
type Turma = { id: string; escola_id: string; nome: string };
type Aluno = { id: string; nome: string; numero_chamada: number };
type Disciplina = { id: string; nome: string; codigo: string };
type Nota = { aluno_id: string; disciplina_id: string; nota: number | string };
const field: React.CSSProperties = { background: "var(--bg-app)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" };
const chave = (alunoId: string, disciplinaId: string) => `${alunoId}:${disciplinaId}`;

function Conteudo() {
  const router = useRouter();
  const { loading: loadingUser, podeAjustarNotas } = useUsuarioAtual();
  const [escolas, setEscolas] = useState<Escola[]>([]), [turmas, setTurmas] = useState<Turma[]>([]);
  const [escolaId, setEscolaId] = useState(""), [turmaId, setTurmaId] = useState("");
  const [bimestre, setBimestre] = useState(1), [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());
  const [alunos, setAlunos] = useState<Aluno[]>([]), [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [originais, setOriginais] = useState<Record<string, number | null>>({}), [rascunhos, setRascunhos] = useState<Record<string, string>>({});
  const [busca, setBusca] = useState(""), [motivo, setMotivo] = useState("");
  const [carregando, setCarregando] = useState(true), [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(""), [sucesso, setSucesso] = useState("");
  const turmasDaEscola = useMemo(() => turmas.filter((t) => t.escola_id === escolaId), [turmas, escolaId]);
  const alunosFiltrados = useMemo(() => { const q = busca.trim().toLocaleLowerCase("pt-BR"); return q ? alunos.filter((a) => a.nome.toLocaleLowerCase("pt-BR").includes(q)) : alunos; }, [alunos, busca]);
  const invalidas = useMemo(() => Object.entries(rascunhos).filter(([, valor]) => valor !== "" && (!Number.isFinite(Number(valor)) || Number(valor) < 0 || Number(valor) > 10)).map(([key]) => key), [rascunhos]);
  const alteracoes = useMemo(() => Object.entries(rascunhos).flatMap(([key, valor]) => { const nova = Number(valor); if (valor === "" || !Number.isFinite(nova) || nova < 0 || nova > 10 || nova === originais[key]) return []; const [alunoId, disciplinaId] = key.split(":"); return [{ alunoId, disciplinaId, notaAnterior: originais[key], notaNova: nova }]; }), [rascunhos, originais]);
  const alunosAfetados = useMemo(() => new Set(alteracoes.map((a) => a.alunoId)).size, [alteracoes]);

  useEffect(() => {
    if (loadingUser) return;
    if (!podeAjustarNotas) { router.replace("/dashboard"); return; }
    fetch("/api/dev/ajuste-notas", { cache: "no-store" }).then(async (res) => { const json = await res.json(); if (!res.ok) throw new Error(json.error); setEscolas(json.escolas ?? []); setTurmas(json.turmas ?? []); const e = json.escolas?.[0]; if (e) { setEscolaId(e.id); setAnoLetivo(e.ano_letivo); } }).catch((e) => setErro(e.message ?? "Erro ao carregar")).finally(() => setCarregando(false));
  }, [loadingUser, podeAjustarNotas, router]);

  async function carregar(ignorarPendentes = false) {
    if (!turmaId) return setErro("Selecione uma turma.");
    if (!ignorarPendentes && alteracoes.length && !window.confirm("Existem alterações pendentes. Descartar e carregar novamente?")) return;
    setCarregando(true); setErro(""); setSucesso("");
    try {
      const qs = new URLSearchParams({ turmaId, bimestre: String(bimestre), anoLetivo: String(anoLetivo) });
      const res = await fetch(`/api/dev/ajuste-notas?${qs}`, { cache: "no-store" }); const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar notas");
      setAlunos(json.alunos ?? []); setDisciplinas(json.disciplinas ?? []);
      const mapa: Record<string, number | null> = {};
      for (const aluno of json.alunos ?? []) for (const disc of json.disciplinas ?? []) mapa[chave(aluno.id, disc.id)] = null;
      for (const nota of (json.notas ?? []) as Nota[]) mapa[chave(nota.aluno_id, nota.disciplina_id)] = Number(nota.nota);
      setOriginais(mapa); setRascunhos({}); setBusca(""); setMotivo("");
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao carregar notas"); } finally { setCarregando(false); }
  }

  async function salvar() {
    setErro(""); setSucesso("");
    if (invalidas.length) return setErro("Corrija as notas inválidas destacadas em vermelho.");
    if (!alteracoes.length) return setErro("Nenhuma nota foi alterada.");
    if (motivo.trim().length < 10) return setErro("Informe um motivo com pelo menos 10 caracteres.");
    const turma = turmas.find((t) => t.id === turmaId);
    if (!window.confirm(`Você está prestes a alterar ${alteracoes.length} nota(s) de ${alunosAfetados} aluno(s) da turma ${turma?.nome}, ${bimestre}º bimestre. Confirmar?`)) return;
    setSalvando(true);
    try {
      const res = await fetch("/api/dev/ajuste-notas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ escolaId, turmaId, bimestre, anoLetivo, motivo: motivo.trim(), alteracoes }) });
      const json = await res.json(); if (!res.ok) throw new Error(json.error ?? "Erro ao salvar lote");
      setRascunhos({}); setMotivo("");
      await carregar(true);
      setSucesso(`${json.total} nota(s) salva(s) com sucesso. Lote: ${json.batchId}`);
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao salvar lote"); } finally { setSalvando(false); }
  }

  if (loadingUser || (carregando && !escolas.length)) return <main className="min-h-screen p-8" style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}>Carregando...</main>;
  return <main className="min-h-screen p-4 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}><div className="mx-auto max-w-[1600px]">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" style={{ color: "var(--brand-primary)" }} /><span className="text-xs font-semibold uppercase" style={{ color: "var(--brand-primary)" }}>Acesso restrito</span></div><h1 className="mt-2 text-2xl font-bold">Atualização de notas em lote</h1><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Carregue uma turma, edite somente o necessário e salve tudo em uma operação segura.</p></div><button onClick={() => router.back()} className="flex items-center gap-2 px-3 py-2 text-sm" style={field}><ArrowLeft className="h-4 w-4" />Voltar</button></div>
    {erro && <div role="alert" className="mt-4 p-3 text-sm" style={{ borderRadius: "var(--radius-sm)", background: "var(--status-danger-tint)", color: "var(--status-danger-bg)" }}>{erro}</div>}
    {sucesso && <div role="status" className="mt-4 p-3 text-sm" style={{ borderRadius: "var(--radius-sm)", background: "var(--status-success-tint)", color: "var(--status-success-bg)" }}>{sucesso}</div>}
    <section className="mt-5 grid gap-3 p-4 md:grid-cols-5" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
      <label className="grid gap-1 text-sm"><span>Escola</span><StyledSelect value={escolaId} onChange={(e) => { const id=e.target.value, escola=escolas.find((x)=>x.id===id); setEscolaId(id); setAnoLetivo(escola?.ano_letivo ?? anoLetivo); setTurmaId(""); setAlunos([]); }} className="p-2">{escolas.map((e)=><option key={e.id} value={e.id}>{e.nome}</option>)}</StyledSelect></label>
      <label className="grid gap-1 text-sm"><span>Turma</span><StyledSelect value={turmaId} onChange={(e)=>setTurmaId(e.target.value)} className="p-2"><option value="">Selecione...</option>{turmasDaEscola.map((t)=><option key={t.id} value={t.id}>{t.nome}</option>)}</StyledSelect></label>
      <label className="grid gap-1 text-sm"><span>Bimestre</span><StyledSelect value={bimestre} onChange={(e)=>setBimestre(Number(e.target.value))} className="p-2">{[1,2,3,4].map((n)=><option key={n} value={n}>{n}º bimestre</option>)}</StyledSelect></label>
      <label className="grid gap-1 text-sm"><span>Ano</span><input type="number" min="2000" max="2100" value={anoLetivo} onChange={(e)=>setAnoLetivo(Number(e.target.value))} className="p-2" style={field}/></label>
      <button onClick={()=>carregar()} disabled={carregando || !turmaId} className="self-end px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderRadius:"var(--radius-sm)", background:"var(--brand-primary-solid)", color:"var(--status-text-on-color)" }}>{carregando ? "Carregando..." : "Carregar notas"}</button>
    </section>
    {!!alunos.length && <><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><label className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"/><input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Buscar aluno..." className="w-full py-2 pl-10 pr-3" style={field}/></label><div className="flex items-center gap-3"><strong style={{ color: alteracoes.length ? "var(--brand-primary)" : "var(--text-secondary)" }}>{alteracoes.length} alteração(ões) pendente(s)</strong><button onClick={()=>setRascunhos({})} disabled={!Object.keys(rascunhos).length} className="flex items-center gap-1 px-3 py-2 text-sm disabled:opacity-40" style={field}><RotateCcw className="h-4 w-4"/>Descartar</button></div></div>
      <div className="mt-3 max-h-[65vh] overflow-auto" style={{ border:"1px solid var(--border-subtle)", borderRadius:"var(--radius-sm)" }}><table className="w-max min-w-full border-separate border-spacing-0 text-sm"><thead className="sticky top-0 z-20"><tr><th className="sticky left-0 z-30 min-w-64 p-3 text-left" style={{ background:"var(--bg-card)", borderBottom:"1px solid var(--border-subtle)" }}>Aluno</th>{disciplinas.map((d)=><th key={d.id} title={d.nome} className="min-w-28 p-2 text-center" style={{ background:"var(--bg-card)", borderBottom:"1px solid var(--border-subtle)" }}><span className="block text-xs">{d.codigo}</span><span className="block max-w-28 truncate text-xs font-normal" style={{ color:"var(--text-secondary)" }}>{d.nome}</span></th>)}</tr></thead><tbody>{alunosFiltrados.map((a)=><tr key={a.id}><th className="sticky left-0 z-10 whitespace-nowrap p-3 text-left font-medium" style={{ background:"var(--bg-card)", borderBottom:"1px solid var(--border-subtle)" }}>{a.numero_chamada} — {a.nome}</th>{disciplinas.map((d)=>{const k=chave(a.id,d.id), original=originais[k], value=rascunhos[k] ?? (original ?? ""), pendente=alteracoes.some((x)=>x.alunoId===a.id&&x.disciplinaId===d.id), invalida=invalidas.includes(k);return <td key={d.id} className="p-1 text-center" style={{ borderBottom:"1px solid var(--border-subtle)", background: pendente ? "var(--status-warning-tint)" : undefined }}><input aria-label={`${a.nome} - ${d.nome}`} type="number" min="0" max="10" step="0.01" value={value} onChange={(e)=>setRascunhos((old)=>({ ...old,[k]:e.target.value }))} className="w-20 p-2 text-center font-semibold outline-none" style={{...field, borderColor:invalida?"var(--status-danger-bg)":pendente?"var(--status-warning-bg)":"var(--border-subtle)"}}/></td>})}</tr>)}</tbody></table></div>
      <section className="sticky bottom-3 mt-4 flex flex-wrap items-end gap-3 p-4" style={{ borderRadius:"var(--radius-sm)", border:"1px solid var(--border-subtle)", background:"var(--bg-card)", boxShadow:"var(--shadow-card)" }}><label className="grid min-w-64 flex-1 gap-1 text-sm"><span>Motivo geral do lote</span><input value={motivo} maxLength={500} onChange={(e)=>setMotivo(e.target.value)} placeholder="Ex.: Correção solicitada pela coordenação." className="p-2" style={field}/></label><button onClick={salvar} disabled={salvando || !alteracoes.length || !!invalidas.length} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ borderRadius:"var(--radius-sm)", background:"var(--brand-primary-solid)", color:"var(--status-text-on-color)" }}><Save className="h-4 w-4"/>{salvando?"Salvando...":`Salvar ${alteracoes.length} alteração(ões)`}</button></section></>}
  </div></main>;
}
export default function Page() { return <AuthGuard allow={["DEV_MASTER","SUPER_ADMIN"]}><Conteudo/></AuthGuard>; }
