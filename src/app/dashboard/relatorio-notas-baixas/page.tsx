"use client";

import { Fragment, useEffect, useState } from "react";
import { AlertTriangle, BookOpen, Check, Download, FileWarning, Filter, Printer, ShieldCheck, Users } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { useUsuarioAtual } from "../../../hooks/useUsuarioAtual";

type Opcao = { id: string; nome: string };
type Turma = Opcao & { etapa: string; anoSerie: number; ordem: number };
type Disciplina = Opcao & { codigo: string };
type Linha = {
  alunoId: string; aluno: string; turmaId: string; turma: string; numeroChamada: number;
  disciplinaId: string; disciplina: string; codigoCurricular: string; ordemTurma: number; b1: number | null;
  b2: number | null; b3: number | null; b4: number | null; resultado: number;
};
type Dados = {
  escolas: Opcao[]; escolaId: string; escolaNome: string; anoLetivo: number; turmas: Turma[];
  disciplinas: Disciplina[]; ultimoBimestre: number; turmaIds?: string[]; disciplinaId?: string;
  disciplinaNome?: string; modo?: "bimestre" | "acumulado"; bimestre?: number;
  criterio?: string; total?: number; totalResultados?: number; linhas?: Linha[];
};

const card: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" };
const campo: React.CSSProperties = { background: "var(--bg-app)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" };
const nota = (valor: number | null) => valor == null ? "—" : valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

function Conteudo() {
  const { isDevMaster, loading: carregandoUsuario } = useUsuarioAtual();
  const [opcoes, setOpcoes] = useState<Dados | null>(null);
  const [relatorio, setRelatorio] = useState<Dados | null>(null);
  const [escolaId, setEscolaId] = useState("");
  const [turmaIds, setTurmaIds] = useState<string[]>([]);
  const [turmasInicializadasPara, setTurmasInicializadasPara] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [modo, setModo] = useState<"bimestre" | "acumulado">("bimestre");
  const [bimestre, setBimestre] = useState("3");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const turmasKey = turmaIds.join(",");

  useEffect(() => {
    if (carregandoUsuario || !isDevMaster) return;
    let cancelado = false;
    async function carregarOpcoes() {
      setCarregando(true); setErro("");
      const params = new URLSearchParams({ opcoes: "1" });
      if (escolaId) params.set("escolaId", escolaId);
      if (turmasKey) params.set("turmaIds", turmasKey);
      try {
        const response = await fetch(`/api/relatorio-notas-baixas?${params}`, { cache: "no-store" });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "Não foi possível carregar os filtros");
        if (!cancelado) {
          setOpcoes(json.data);
          if (!escolaId) setEscolaId(json.data.escolaId);
          if (turmasInicializadasPara !== json.data.escolaId) {
            setTurmaIds(json.data.turmas.map((turma: Turma) => turma.id));
            setTurmasInicializadasPara(json.data.escolaId);
          }
          if (disciplinaId && !json.data.disciplinas.some((item: Disciplina) => item.id === disciplinaId)) setDisciplinaId("");
          setBimestre((atual) => Number(atual) > json.data.ultimoBimestre ? String(json.data.ultimoBimestre) : atual);
        }
      } catch (e) { if (!cancelado) setErro(e instanceof Error ? e.message : "Erro inesperado"); }
      finally { if (!cancelado) setCarregando(false); }
    }
    void carregarOpcoes();
    return () => { cancelado = true; };
  }, [carregandoUsuario, isDevMaster, escolaId, turmasKey, turmasInicializadasPara, disciplinaId]);

  function alternarTurma(id: string) {
    setRelatorio(null);
    setTurmaIds((atuais) => {
      if (atuais.includes(id)) return atuais.length === 1 ? atuais : atuais.filter((item) => item !== id);
      return [...atuais, id];
    });
  }

  async function gerar() {
    if (!turmaIds.length) { setErro("Selecione pelo menos uma turma."); return; }
    setCarregando(true); setErro(""); setRelatorio(null);
    const params = new URLSearchParams({ escolaId, modo, bimestre, turmaIds: turmasKey });
    if (disciplinaId) params.set("disciplinaId", disciplinaId);
    try {
      const response = await fetch(`/api/relatorio-notas-baixas?${params}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Não foi possível gerar o relatório");
      setRelatorio(json.data);
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro inesperado"); }
    finally { setCarregando(false); }
  }

  function exportarCsv() {
    if (!relatorio?.linhas) return;
    const proteger = (valor: string | number) => { const texto = String(valor); const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto; return `"${seguro.replaceAll('"', '""')}"`; };
    const titulo = relatorio.modo === "acumulado" ? "Média acumulada" : `Nota do ${relatorio.bimestre}º bim.`;
    const linhas = [["Aluno","Turma","Chamada","Código","Disciplina","1º bim.","2º bim.","3º bim.","4º bim.",titulo], ...relatorio.linhas.map((item) => [item.aluno,item.turma,item.numeroChamada,item.codigoCurricular,item.disciplina,item.b1 ?? "",item.b2 ?? "",item.b3 ?? "",item.b4 ?? "",item.resultado])];
    const blob = new Blob(["\uFEFF" + linhas.map((linha) => linha.map(proteger).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `notas-abaixo-de-5-${relatorio.anoLetivo}.csv`; link.click(); URL.revokeObjectURL(link.href);
  }

  if (!carregandoUsuario && !isDevMaster) return <main className="min-h-screen p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}><div className="mx-auto max-w-xl rounded-2xl p-8 text-center" style={card}><ShieldCheck className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--status-danger-bg)" }} /><h1 className="text-xl font-bold">Área exclusiva do Dev Master</h1></div></main>;

  const tituloResultado = relatorio?.modo === "acumulado" ? `Média acumulada até o ${relatorio.bimestre}º bimestre` : `Nota do ${relatorio?.bimestre}º bimestre`;
  return <main className="min-h-screen p-4 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}><div className="mx-auto max-w-[1500px]">
    <header className="nao-imprimir overflow-hidden rounded-3xl border p-6 md:p-8" style={{ ...card, background: "radial-gradient(circle at 90% 0%,rgba(239,68,68,.18),transparent 36%),var(--bg-card)" }}><div className="flex flex-wrap items-start justify-between gap-5"><div><span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider" style={{ background: "var(--status-danger-tint)", color: "var(--status-danger-bg)" }}><FileWarning className="h-4 w-4" /> Exclusivo Dev Master</span><h1 className="mt-4 text-3xl font-black md:text-4xl">Relatório de notas baixas</h1><p className="mt-2 max-w-3xl" style={{ color: "var(--text-secondary)" }}>Selecione uma ou várias turmas e localize alunos com resultado inferior a 5,0 em uma disciplina específica ou em todas.</p></div><AlertTriangle className="h-14 w-14" strokeWidth={1.5} style={{ color: "var(--status-danger-bg)" }} /></div></header>

    <section className="nao-imprimir mt-5 rounded-3xl border p-5" style={card}>
      <div className="mb-4 flex items-center gap-2"><Filter className="h-5 w-5" style={{ color: "var(--brand-primary)" }} /><h2 className="font-black">Filtros do relatório</h2></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Escola<StyledSelect value={escolaId} onChange={(e) => { setEscolaId(e.target.value); setTurmaIds([]); setTurmasInicializadasPara(""); setDisciplinaId(""); setRelatorio(null); }} className="mt-2 w-full p-3 text-sm" style={campo}>{opcoes?.escolas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</StyledSelect></label>
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Disciplina<StyledSelect value={disciplinaId} onChange={(e) => { setDisciplinaId(e.target.value); setRelatorio(null); }} className="mt-2 w-full p-3 text-sm" style={campo}><option value="">Todas as disciplinas</option>{opcoes?.disciplinas.map((item) => <option key={item.id} value={item.id}>{item.codigo} · {item.nome}</option>)}</StyledSelect></label>
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Tipo de resultado<StyledSelect value={modo} onChange={(e) => { setModo(e.target.value as "bimestre" | "acumulado"); setRelatorio(null); }} className="mt-2 w-full p-3 text-sm" style={campo}><option value="bimestre">Nota do bimestre</option><option value="acumulado">Média acumulada</option></StyledSelect></label>
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Período<StyledSelect value={bimestre} onChange={(e) => { setBimestre(e.target.value); setRelatorio(null); }} className="mt-2 w-full p-3 text-sm" style={campo}>{[1,2,3,4].filter((item) => item <= (opcoes?.ultimoBimestre ?? 4)).map((item) => <option key={item} value={item}>{modo === "acumulado" ? `Até o ${item}º bimestre` : `${item}º bimestre`}</option>)}</StyledSelect></label>
      </div>

      <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)" }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Séries / turmas para o PDF</p><p className="mt-1 text-sm">{turmaIds.length} de {opcoes?.turmas.length ?? 0} selecionadas</p></div><button onClick={() => { setTurmaIds(opcoes?.turmas.map((item) => item.id) ?? []); setRelatorio(null); }} className="rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: "var(--border-subtle)" }}>Selecionar todas</button></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{opcoes?.turmas.map((turma) => { const selecionada = turmaIds.includes(turma.id); return <button key={turma.id} onClick={() => alternarTurma(turma.id)} className="flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-bold transition" style={{ borderColor: selecionada ? "var(--brand-primary)" : "var(--border-subtle)", background: selecionada ? "var(--bg-sidebar-active)" : "var(--bg-card)", color: selecionada ? "var(--brand-primary)" : "var(--text-secondary)" }}><span className="flex h-5 w-5 items-center justify-center rounded border" style={{ borderColor: selecionada ? "var(--brand-primary)" : "var(--border-subtle)", background: selecionada ? "var(--brand-primary-solid)" : "transparent", color: "white" }}>{selecionada && <Check className="h-3 w-3" />}</span>{turma.nome}</button>; })}</div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--status-danger-tint)", color: "var(--status-danger-bg)" }}><strong>Critério:</strong> resultado de 0,0 a 4,99</div><button onClick={() => void gerar()} disabled={carregando || !turmaIds.length} className="rounded-xl px-5 py-3 text-sm font-black text-white disabled:opacity-50" style={{ background: "var(--brand-primary-solid)" }}>{carregando ? "Consultando..." : "Gerar relatório"}</button></div>
    </section>
    {erro && <div className="nao-imprimir mt-4 rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--status-danger-bg)", color: "var(--status-danger-bg)" }}>{erro}</div>}

    {relatorio && <section className="relatorio-impressao mt-6"><header className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b-2 pb-4" style={{ borderColor: "var(--text-primary)" }}><div><p className="text-xs font-bold uppercase tracking-[.16em]" style={{ color: "var(--status-danger-bg)" }}>Relatório pedagógico restrito</p><h2 className="mt-1 text-2xl font-black">Alunos com resultado abaixo de 5,0</h2><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{relatorio.escolaNome} · {relatorio.disciplinaNome} · {tituloResultado} · {relatorio.anoLetivo}</p></div><div className="text-right"><p className="text-3xl font-black" style={{ color: "var(--status-danger-bg)" }}>{relatorio.total}</p><p className="text-xs" style={{ color: "var(--text-secondary)" }}>alunos identificados{relatorio.totalResultados !== relatorio.total ? ` · ${relatorio.totalResultados} resultados` : ""}</p></div></header><div className="nao-imprimir mb-4 flex justify-end gap-2"><button onClick={exportarCsv} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: "var(--status-success-solid)" }}><Download className="h-4 w-4" /> CSV</button><button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: "var(--brand-primary-solid)" }}><Printer className="h-4 w-4" /> Gerar PDF</button></div>
      <div className="resumo-impressao grid gap-3 sm:grid-cols-3"><div className="rounded-2xl p-4" style={card}><Users className="h-5 w-5" style={{ color: "var(--status-danger-bg)" }} /><p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>Alunos no relatório</p><p className="text-2xl font-black">{relatorio.total}</p></div><div className="rounded-2xl p-4" style={card}><BookOpen className="h-5 w-5" style={{ color: "var(--brand-primary)" }} /><p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>Disciplina</p><p className="font-black">{relatorio.disciplinaNome}</p></div><div className="rounded-2xl p-4" style={card}><AlertTriangle className="h-5 w-5" style={{ color: "var(--status-danger-bg)" }} /><p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>Turmas selecionadas</p><p className="font-black">{relatorio.turmaIds?.length ?? 0}</p></div></div>
      <div className="mt-4 overflow-x-auto rounded-2xl border" style={card}><table className="tabela-relatorio-baixas w-full min-w-[1080px] text-sm"><thead style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}><tr><th className="px-4 py-3 text-left">Aluno</th><th className="px-4 py-3 text-left">Turma</th><th className="px-3 py-3 text-center">Chamada</th><th className="px-4 py-3 text-left">Disciplina</th><th className="px-3 py-3 text-center">1º bim.</th><th className="px-3 py-3 text-center">2º bim.</th><th className="px-3 py-3 text-center">3º bim.</th><th className="px-3 py-3 text-center">4º bim.</th><th className="px-4 py-3 text-right">{relatorio.modo === "acumulado" ? "Média" : "Nota"}</th></tr></thead><tbody>{relatorio.linhas?.map((item, indice, todos) => <Fragment key={`${item.alunoId}-${item.turmaId}-${item.disciplinaId}`}>
        {(indice === 0 || todos[indice - 1].turmaId !== item.turmaId) && <tr className="cabecalho-turma-impressao" style={{ breakInside: "avoid" }}><td colSpan={9} className="border-y px-4 py-3 text-base font-black" style={{ borderColor: "var(--brand-primary)", background: "var(--bg-sidebar-active)", color: "var(--brand-primary)" }}>{item.turma}</td></tr>}
        <tr className="border-t" style={{ borderColor: "var(--border-subtle)", breakInside: "avoid" }}><td className="px-4 py-3 font-bold">{item.aluno}</td><td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{item.turma}</td><td className="px-3 py-3 text-center">{item.numeroChamada}</td><td className="px-4 py-3"><span className="codigo-curricular-impressao mr-2 font-black" style={{ color: "var(--brand-primary)" }}>{item.codigoCurricular}</span>{item.disciplina}</td>{[item.b1,item.b2,item.b3,item.b4].map((valor,bim) => <td key={bim} className="px-3 py-3 text-center">{nota(valor)}</td>)}<td className="nota-critica-impressao px-4 py-3 text-right text-lg font-black" style={{ color: "var(--status-danger-bg)" }}>{nota(item.resultado)}</td></tr>
      </Fragment>)}</tbody></table>{relatorio.total === 0 && <p className="p-10 text-center" style={{ color: "var(--text-secondary)" }}>Nenhum aluno com resultado abaixo de 5,0 nos filtros selecionados.</p>}</div>
      <p className="mt-4 text-center text-xs" style={{ color: "var(--text-secondary)" }}>As turmas são organizadas do 6º ano à 3ª série do Ensino Médio. O código exibido é o da matriz curricular de cada turma.</p>
    </section>}
  </div></main>;
}

export default function Page() { return <AuthGuard allow={["DEV_MASTER"]}><Conteudo /></AuthGuard>; }
