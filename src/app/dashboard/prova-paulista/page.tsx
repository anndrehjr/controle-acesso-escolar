"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, MousePointerClick, RotateCcw, School, TrendingDown, TrendingUp, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { useUsuarioAtual } from "../../../hooks/useUsuarioAtual";
import { rolesWithCapability } from "../../../types/roles";

const ROLES = rolesWithCapability("viewReports");
const NOMES: Record<string, string> = { GERAL: "Resultado geral", MAT: "Matemática", PORT: "Língua Portuguesa", ING: "Inglês", HIST: "História", GEO: "Geografia", CIE: "Ciências", FILO: "Filosofia", SOC: "Sociologia", BIO: "Biologia", FIS: "Física", QUI: "Química", FIN: "Educação Financeira", TEC: "Tecnologia" };
const CORES = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];
type Turma = { id: string; nome: string; ano_serie: number };
type Resultado = { turma_id: string; ano_letivo: number; bimestre: number; disciplina_codigo: string; percentual_acertos: number };
type Dados = { escola: { id: string; nome: string }; anoLetivo: number; anos: number[]; turmas: Turma[]; resultados: Resultado[]; podeImportar: boolean };

const card: React.CSSProperties = { border: "1px solid var(--border-subtle)", background: "var(--bg-card)", borderRadius: "1.5rem", boxShadow: "var(--shadow-card)" };
const input: React.CSSProperties = { border: "1px solid var(--border-subtle)", background: "var(--bg-app)", color: "var(--text-primary)", borderRadius: "0.75rem" };
function cor(valor: number | null) { if (valor == null) return "var(--text-secondary)"; if (valor < 40) return "#ef4444"; if (valor < 60) return "#f59e0b"; return "#10b981"; }
function fundo(valor: number | null) { if (valor == null) return "var(--bg-app)"; if (valor < 40) return "rgba(239,68,68,.12)"; if (valor < 60) return "rgba(245,158,11,.12)"; return "rgba(16,185,129,.12)"; }
function Conteudo() {
  const { usuario } = useUsuarioAtual();
  const [dados, setDados] = useState<Dados | null>(null);
  const [ano, setAno] = useState(2026);
  const [turmaId, setTurmaId] = useState("");
  const [bimestre, setBimestre] = useState(3);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [detalhesDisciplinas, setDetalhesDisciplinas] = useState(false);
  const [visaoDisciplinas, setVisaoDisciplinas] = useState<"TODOS" | 1 | 2 | 3>("TODOS");
  const [disciplinaDetalhe, setDisciplinaDetalhe] = useState("");

  async function carregar(anoAlvo = ano) {
    if (!usuario?.escola_id) return;
    setLoading(true); setErro(null);
    try {
      const res = await fetch(`/api/prova-paulista?escolaId=${usuario.escola_id}&ano=${anoAlvo}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar resultados");
      setDados(json);
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro inesperado"); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (usuario?.escola_id) void carregar(ano);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.escola_id, ano]);

  const analise = useMemo(() => {
    if (!dados) return null;
    const resultados = dados.resultados.filter((r) => !turmaId || r.turma_id === turmaId);
    const turmaNome = new Map(dados.turmas.map((t) => [t.id, t.nome]));
    const gerais = dados.resultados.filter((r) => r.disciplina_codigo === "GERAL");
    const atuais = gerais.filter((r) => r.bimestre === bimestre);
    const melhor = [...atuais].sort((a, b) => b.percentual_acertos - a.percentual_acertos)[0];
    const porTurma = dados.turmas.map((t) => {
      const vals = gerais.filter((r) => r.turma_id === t.id);
      const inicio = vals.find((r) => r.bimestre === 1)?.percentual_acertos;
      const fim = vals.find((r) => r.bimestre === bimestre)?.percentual_acertos;
      return { id: t.id, nome: t.nome, inicio, fim, delta: inicio != null && fim != null ? fim - inicio : null };
    });
    const maiorEvolucao = [...porTurma].filter((t) => t.delta != null).sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))[0];
    const materiaAtual = new Map<string, number[]>();
    for (const r of resultados.filter((item) => item.bimestre === bimestre && item.disciplina_codigo !== "GERAL")) {
      if (!materiaAtual.has(r.disciplina_codigo)) materiaAtual.set(r.disciplina_codigo, []);
      materiaAtual.get(r.disciplina_codigo)!.push(r.percentual_acertos);
    }
    const materias = [...materiaAtual].map(([codigo, vals]) => ({ codigo, nome: NOMES[codigo] ?? codigo, valor: vals.reduce((a, v) => a + v, 0) / vals.length })).sort((a, b) => a.valor - b.valor);
    const turmasGrafico = dados.turmas.filter((turma) => !turmaId || turma.id === turmaId).filter((turma) => gerais.some((r) => r.turma_id === turma.id));
    const tendencia = [1, 2, 3, 4].map((b) => ({ periodo: `B${b}`, ...Object.fromEntries(turmasGrafico.map((turma) => [turma.nome, gerais.find((r) => r.turma_id === turma.id && r.bimestre === b)?.percentual_acertos ?? null])) }));
    const disciplinas = [...new Set(resultados.filter((r) => r.disciplina_codigo !== "GERAL").map((r) => r.disciplina_codigo))];
    const tabela = disciplinas.map((codigo) => ({ codigo, nome: NOMES[codigo] ?? codigo, valores: [1, 2, 3, 4].map((b) => { const vals = resultados.filter((r) => r.disciplina_codigo === codigo && r.bimestre === b).map((r) => r.percentual_acertos); return vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : null; }) })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return { melhor: melhor ? { nome: turmaNome.get(melhor.turma_id), valor: melhor.percentual_acertos } : null, maiorEvolucao, materias, tendencia, turmasGrafico, tabela, atualGeral: turmaId ? atuais.find((r) => r.turma_id === turmaId)?.percentual_acertos ?? null : atuais.length ? atuais.reduce((a, r) => a + r.percentual_acertos, 0) / atuais.length : null };
  }, [dados, turmaId, bimestre]);

  function abrirDetalhesDisciplinas() {
    if (!disciplinaDetalhe && analise?.tabela[0]) setDisciplinaDetalhe(analise.tabela[0].codigo);
    setDetalhesDisciplinas(true);
  }

  if (usuario && !usuario.escola_id) return <main className="min-h-screen p-8" style={{ background: "var(--bg-app)" }}>Selecione uma escola para abrir a Prova Paulista.</main>;
  return <main className="min-h-screen p-5 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="relative overflow-hidden p-6 md:p-8" style={{ ...card, borderColor: "rgba(59,130,246,.35)", background: "radial-gradient(circle at 85% 10%,rgba(139,92,246,.20),transparent 34%),radial-gradient(circle at 15% 100%,rgba(6,182,212,.14),transparent 36%),var(--bg-card)" }}>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}><BarChart3 className="h-4 w-4" /> Avaliação externa</div><h1 className="text-3xl font-black md:text-4xl">Prova Paulista</h1><p className="mt-2 text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>{dados?.escola.nome ?? "Escola"} · resultados em percentual de acertos</p></div><div className="prova-aviso max-w-xl rounded-2xl border p-4 text-sm font-semibold leading-relaxed" style={{ borderColor: "var(--status-warning-bg)", background: "var(--status-warning-tint)" }}>Estes resultados são exclusivos da Prova Paulista. Eles não entram na média escolar, no boletim ou nos cálculos de aprovação.</div></div>
      </header>

      <section className="p-5 md:p-6" style={{ ...card, borderColor: "rgba(59,130,246,.28)" }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em]" style={{ color: "var(--brand-primary)" }}>Filtros da análise</p><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Escolha o período e a turma que deseja visualizar.</p></div><button onClick={()=>{setAno(2026);setTurmaId("");setBimestre(3);}} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)" }}><RotateCcw className="h-3.5 w-3.5"/> Limpar filtros</button></div>
        <div className="grid gap-4 lg:grid-cols-[180px_1fr_1.4fr]">
          <label className="grid gap-1.5 text-sm"><span className="font-semibold">Ano letivo</span><StyledSelect value={ano} onChange={(e) => setAno(Number(e.target.value))} className="p-3" style={input}>{[...new Set([ano, ...(dados?.anos ?? []), 2026])].sort((a,b)=>b-a).map((item)=><option key={item}>{item}</option>)}</StyledSelect></label>
          <label className="grid gap-1.5 text-sm"><span className="font-semibold">Turma</span><StyledSelect value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="p-3" style={input}><option value="">Visão geral — todas as turmas</option>{dados?.turmas.map((t)=><option key={t.id} value={t.id}>{t.nome}</option>)}</StyledSelect></label>
          <div className="grid gap-1.5 text-sm"><span className="font-semibold">Bimestre em destaque</span><div className="grid grid-cols-4 gap-2 rounded-xl p-1.5" style={{ background: "var(--bg-app)", border: "1px solid var(--border-subtle)" }}>{[1,2,3,4].map((b)=><button key={b} onClick={()=>setBimestre(b)} className="rounded-lg px-2 py-2.5 text-sm font-black transition" style={{ background:bimestre===b?CORES[b-1]:"transparent", color:bimestre===b?"white":"var(--text-secondary)", boxShadow:bimestre===b?`0 8px 24px ${CORES[b-1]}45`:"none" }}>{b}º</button>)}</div></div>
        </div>
      </section>
      {erro && <div className="rounded-2xl border p-4 text-sm font-semibold" style={{ borderColor: "var(--status-danger-bg)", background: "var(--status-danger-tint)", color: "var(--status-danger-bg)" }}>{erro}</div>}
      {loading ? <div className="h-96 animate-pulse" style={card} /> : analise && <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[{ icon: School, cor: "#3b82f6", titulo: "Resultado geral", valor: analise.atualGeral == null ? "—" : `${analise.atualGeral.toFixed(1)}%`, detalhe: turmaId ? "turma selecionada" : "média das turmas" }, { icon: CheckCircle2, cor: "#10b981", titulo: "Melhor turma", valor: analise.melhor?.nome ?? "—", detalhe: analise.melhor ? `${analise.melhor.valor.toFixed(1)}% no B${bimestre}` : "sem dados" }, { icon: TrendingUp, cor: "#8b5cf6", titulo: "Maior evolução", valor: analise.maiorEvolucao?.nome ?? "—", detalhe: analise.maiorEvolucao?.delta != null ? `${analise.maiorEvolucao.delta >= 0 ? "+" : ""}${analise.maiorEvolucao.delta.toFixed(1)}% desde o B1` : "sem comparação" }, { icon: AlertTriangle, cor: "#ef4444", titulo: "Ponto de atenção", valor: analise.materias[0]?.nome ?? "—", detalhe: analise.materias[0] ? `${analise.materias[0].valor.toFixed(1)}% no B${bimestre}` : "sem dados" }].map((kpi)=><article key={kpi.titulo} className="relative overflow-hidden p-5" style={{...card,borderColor:`${kpi.cor}55`}}><div className="absolute inset-x-0 top-0 h-1" style={{background:kpi.cor}}/><div className="inline-flex rounded-xl p-2.5" style={{background:`${kpi.cor}18`,color:kpi.cor}}><kpi.icon className="h-5 w-5" /></div><p className="mt-4 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{kpi.titulo}</p><p className="mt-1 truncate text-2xl font-black">{kpi.valor}</p><p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{kpi.detalhe}</p></article>)}
        </section>
        <section className="grid gap-6 xl:grid-cols-2">
          <article className="p-5 md:p-6" style={card}><h2 className="text-xl font-black">Evolução das turmas</h2><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Percentual geral de acertos em cada bimestre.</p><div className="mt-5 h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={analise.tendencia}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="periodo"/><YAxis domain={[0,100]} unit="%"/><Tooltip formatter={(v)=>v == null ? "Sem dados" : `${Number(v).toFixed(1)}%`}/><Legend/>{analise.turmasGrafico.map((turma,i)=><Line key={turma.id} type="monotone" dataKey={turma.nome} stroke={CORES[i%CORES.length]} strokeWidth={3} connectNulls={false}/>)}</LineChart></ResponsiveContainer></div></article>
          <article role="button" tabIndex={0} onClick={abrirDetalhesDisciplinas} onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" ")abrirDetalhesDisciplinas();}} className="cursor-pointer p-5 transition hover:-translate-y-0.5 md:p-6" style={card}><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black">Disciplinas no {bimestre}º bimestre</h2><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{turmaId ? "Resultado da turma selecionada." : "Média entre as turmas com resultado."}</p></div><span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold" style={{background:"rgba(59,130,246,.14)",color:"var(--brand-primary)"}}><MousePointerClick className="h-3.5 w-3.5"/> Comparar</span></div><div className="mt-3 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full px-2.5 py-1" style={{background:"rgba(239,68,68,.12)",color:"#ef4444"}}>Abaixo de 40%</span><span className="rounded-full px-2.5 py-1" style={{background:"rgba(245,158,11,.12)",color:"#f59e0b"}}>40% a 59,9%</span><span className="rounded-full px-2.5 py-1" style={{background:"rgba(16,185,129,.12)",color:"#10b981"}}>60% ou mais</span></div><div className="mt-4 h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={[...analise.materias].reverse()} layout="vertical" margin={{left:25}}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis type="number" domain={[0,100]} unit="%"/><YAxis type="category" dataKey="nome" width={105} tick={{fontSize:11}}/><Tooltip formatter={(v)=>`${Number(v).toFixed(1)}%`}/><Bar dataKey="valor" name="Acertos" radius={[0,8,8,0]}>{[...analise.materias].reverse().map((item)=><Cell key={item.codigo} fill={cor(item.valor)}/>)}</Bar></BarChart></ResponsiveContainer></div><p className="mt-2 text-center text-xs font-semibold" style={{color:"var(--brand-primary)"}}>Clique no gráfico para comparar os bimestres e visualizar a evolução por matéria.</p></article>
        </section>
        <section className="overflow-hidden" style={card}><div className="p-5 md:p-6"><h2 className="text-xl font-black">Comparativo por disciplina</h2><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Acompanhe a evolução sem transformar percentual de acertos em nota escolar.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}><tr><th className="px-5 py-3 text-left">Disciplina</th>{[1,2,3,4].map((b)=><th key={b} className="px-5 py-3 text-center">{b}º bimestre</th>)}<th className="px-5 py-3 text-center">Variação B1 → B{bimestre}</th></tr></thead><tbody>{analise.tabela.map((d)=>{const inicial=d.valores[0], final=d.valores[bimestre-1], delta=inicial!=null&&final!=null?final-inicial:null;return <tr key={d.codigo} className="transition hover:bg-white/[.025]" style={{ borderTop:"1px solid var(--border-subtle)" }}><td className="px-5 py-3 font-bold">{d.nome}</td>{d.valores.map((v,i)=><td key={i} className="px-5 py-3 text-center font-black"><span className="inline-flex min-w-20 justify-center rounded-full px-3 py-1.5" style={{color:cor(v),background:fundo(v)}}>{v==null?"Sem dados":`${v.toFixed(1)}%`}</span></td>)}<td className="px-5 py-3 text-center font-black" style={{color:delta==null?"var(--text-secondary)":delta>=0?"var(--status-success-bg)":"var(--status-danger-bg)"}}>{delta==null?"—":<span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5" style={{background:delta>=0?"rgba(16,185,129,.12)":"rgba(239,68,68,.12)"}}>{delta>=0?<TrendingUp className="h-4 w-4"/>:<TrendingDown className="h-4 w-4"/>}{delta>=0?"+":""}{delta.toFixed(1)}%</span>}</td></tr>})}</tbody></table></div></section>
        {detalhesDisciplinas && (()=>{const selecionada=analise.tabela.find((d)=>d.codigo===(disciplinaDetalhe||analise.tabela[0]?.codigo));const comparacao=analise.tabela.map((d)=>({nome:d.nome,B1:d.valores[0],B2:d.valores[1],B3:d.valores[2]}));const evolucao=[1,2,3].map((b)=>({periodo:`${b}º bimestre`,valor:selecionada?.valores[b-1]??null}));return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onClick={()=>setDetalhesDisciplinas(false)}><div className="mx-auto my-4 max-w-6xl rounded-3xl border p-5 shadow-2xl md:p-7" style={{background:"var(--bg-card)",borderColor:"rgba(59,130,246,.4)"}} onClick={(e)=>e.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><div className="mb-2 inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{background:"rgba(59,130,246,.14)",color:"var(--brand-primary)"}}>Análise interativa</div><h2 className="text-2xl font-black">Comparação das disciplinas</h2><p className="mt-1 text-sm" style={{color:"var(--text-secondary)"}}>Compare os três bimestres ou destaque somente um período.</p></div><button aria-label="Fechar" onClick={()=>setDetalhesDisciplinas(false)} className="rounded-xl border p-2" style={{borderColor:"var(--border-subtle)"}}><X className="h-5 w-5"/></button></div><div className="mt-5 grid grid-cols-4 gap-2 rounded-xl p-1.5" style={{background:"var(--bg-app)",border:"1px solid var(--border-subtle)"}}>{([{v:"TODOS",t:"Comparar 3"},{v:1,t:"1º"},{v:2,t:"2º"},{v:3,t:"3º"}] as const).map((op)=><button key={op.v} onClick={()=>setVisaoDisciplinas(op.v)} className="rounded-lg px-2 py-2.5 text-sm font-black" style={{background:visaoDisciplinas===op.v?"var(--brand-primary-solid)":"transparent",color:visaoDisciplinas===op.v?"white":"var(--text-secondary)"}}>{op.t}</button>)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]"><section className="rounded-2xl border p-4" style={{borderColor:"var(--border-subtle)",background:"var(--bg-app)"}}><h3 className="font-black">{visaoDisciplinas==="TODOS"?"1º × 2º × 3º bimestre":`${visaoDisciplinas}º bimestre`}</h3><div className="mt-3 h-[430px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparacao} layout="vertical" margin={{left:30}}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis type="number" domain={[0,100]} unit="%"/><YAxis type="category" dataKey="nome" width={110} tick={{fontSize:11}}/><Tooltip formatter={(v)=>v==null?"Sem dados":`${Number(v).toFixed(1)}%`}/>{visaoDisciplinas==="TODOS"?<><Legend/><Bar dataKey="B1" fill={CORES[0]} radius={[0,5,5,0]}/><Bar dataKey="B2" fill={CORES[1]} radius={[0,5,5,0]}/><Bar dataKey="B3" fill={CORES[2]} radius={[0,5,5,0]}/></>:<Bar dataKey={`B${visaoDisciplinas}`} fill={CORES[visaoDisciplinas-1]} radius={[0,6,6,0]}/>}</BarChart></ResponsiveContainer></div></section><section className="rounded-2xl border p-4" style={{borderColor:"var(--border-subtle)",background:"var(--bg-app)"}}><h3 className="font-black">Evolução de uma matéria</h3><StyledSelect value={selecionada?.codigo??""} onChange={(e)=>setDisciplinaDetalhe(e.target.value)} className="mt-3 w-full p-3" style={input}>{analise.tabela.map((d)=><option key={d.codigo} value={d.codigo}>{d.nome}</option>)}</StyledSelect><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={evolucao}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="periodo" tick={{fontSize:11}}/><YAxis domain={[0,100]} unit="%"/><Tooltip formatter={(v)=>v==null?"Sem dados":`${Number(v).toFixed(1)}%`}/><Line type="monotone" dataKey="valor" name={selecionada?.nome} stroke="#06b6d4" strokeWidth={4} dot={{r:6,fill:"#06b6d4"}} connectNulls={false}/></LineChart></ResponsiveContainer></div><div className="mt-4 grid grid-cols-3 gap-2">{evolucao.map((item)=><div key={item.periodo} className="rounded-xl p-3 text-center" style={{background:fundo(item.valor)}}><p className="text-xs" style={{color:"var(--text-secondary)"}}>{item.periodo}</p><p className="mt-1 text-lg font-black" style={{color:cor(item.valor)}}>{item.valor==null?"—":`${item.valor.toFixed(1)}%`}</p></div>)}</div></section></div></div></div>})()}
      </>}
    </div>
  </main>;
}
export default function Page() { return <AuthGuard allow={ROLES}><Conteudo/></AuthGuard>; }
