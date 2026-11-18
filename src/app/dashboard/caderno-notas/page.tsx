"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Calculator, FileSpreadsheet, Plus, Printer, Save, Settings2, ShieldCheck, Trash2 } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { calcularNotaCaderno, componentesPadrao, type ComponenteCaderno } from "../../../lib/caderno-dev";
import { useUsuarioAtual } from "../../../hooks/useUsuarioAtual";

type Escola = { id: string; nome: string; anoLetivo: number; bimestreAtual: number };
type Turma = { id: string; nome: string; etapa: string; anoSerie: number; ordem: number };
type Disciplina = { id: string; nome: string; codigo: string };
type Aluno = { matriculaId: string; alunoId: string; nome: string; numeroChamada: number };
type Componente = ComponenteCaderno & { id: string; ordem: number };
type Opcoes = { escolas: Escola[]; escolaId: string; escolaNome: string; anoLetivo: number; bimestreAtual: number; turmas: Turma[]; turmaId: string; disciplinas: Disciplina[] };
type Caderno = Opcoes & { turmaNome: string; disciplinaId: string; disciplinaNome: string; codigoCurricular: string; bimestre: number; cadernoId: string | null; atualizadoEm: string | null; componentes: Componente[]; alunos: Aluno[]; resultados: Array<{ matriculaId: string; componenteId: string; nota: number }> };

const card: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" };
const campo: React.CSSProperties = { background: "var(--bg-app)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" };
const notaTexto = (nota: number | null) => nota == null ? "—" : nota.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const corNota = (nota: number | null) => nota == null ? "var(--text-secondary)" : nota < 5 ? "var(--status-danger-bg)" : nota >= 8 ? "var(--brand-primary)" : nota >= 7 ? "var(--status-success-bg)" : "var(--status-warning-bg)";const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function disciplinasDoProfessor(turma: Turma | undefined, disciplinas: Disciplina[]) {
  if (!turma) return [];
  return disciplinas.filter((disciplina) => {
    const nome = normalizar(disciplina.nome);
    if (turma.etapa === "EF" && [6,9].includes(turma.anoSerie)) return nome.includes("oe - matematica");
    if (turma.etapa === "EF" && [7,8].includes(turma.anoSerie)) return nome.includes("educacao financeira");
    if (turma.etapa === "EM" && turma.anoSerie === 2) return nome === "matematica" || nome.includes("educacao financeira");
    if (turma.etapa === "EM" && turma.anoSerie === 3) return nome.includes("oe - matematica");
    return false;
  });
}

function Conteudo() {
  const { isDevMaster, loading: carregandoUsuario } = useUsuarioAtual();
  const [opcoes, setOpcoes] = useState<Opcoes | null>(null);
  const [caderno, setCaderno] = useState<Caderno | null>(null);
  const [escolaId, setEscolaId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());
  const [bimestre, setBimestre] = useState(4);
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [valores, setValores] = useState<Record<string,string[]>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregarOpcoes = useCallback(async (escola?: string, turma?: string) => {
    const params = new URLSearchParams({ opcoes: "1" });
    if (escola) params.set("escolaId", escola);
    if (turma) params.set("turmaId", turma);
    const response = await fetch(`/api/caderno-dev?${params}`, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error ?? "Não foi possível carregar os filtros");
    const dados = json.data as Opcoes;
    setOpcoes(dados); setEscolaId(dados.escolaId); setAnoLetivo(dados.anoLetivo);
    setBimestre((atual) => [1,2,3,4].includes(atual) ? atual : (dados.bimestreAtual || 4));
    const proximaTurma = turma && dados.turmas.some((item) => item.id === turma) ? turma : dados.turmaId;
    setTurmaId(proximaTurma);
    const pessoais = disciplinasDoProfessor(dados.turmas.find((item) => item.id === proximaTurma),dados.disciplinas);
    setDisciplinaId((atual) => pessoais.some((item) => item.id === atual) ? atual : pessoais[0]?.id ?? "");
  }, []);

  useEffect(() => {
    if (carregandoUsuario || !isDevMaster) return;
    const temporizador = window.setTimeout(() => {
      carregarOpcoes().catch((error) => setMensagem(error.message)).finally(() => setCarregando(false));
    }, 0);
    return () => window.clearTimeout(temporizador);
  }, [carregandoUsuario,isDevMaster,carregarOpcoes]);

  async function selecionarEscola(id: string) {
    setCarregando(true); setCaderno(null); setDisciplinaId(""); setMensagem("");
    try { await carregarOpcoes(id); } catch (error) { setMensagem(error instanceof Error ? error.message : "Erro ao carregar"); }
    finally { setCarregando(false); }
  }
  async function selecionarTurma(id: string) {
    setCarregando(true); setTurmaId(id); setCaderno(null); setDisciplinaId(""); setMensagem("");
    try { await carregarOpcoes(escolaId,id); } catch (error) { setMensagem(error instanceof Error ? error.message : "Erro ao carregar"); }
    finally { setCarregando(false); }
  }

  const carregarCaderno = useCallback(async () => {
    if (!escolaId || !turmaId || !disciplinaId) return;
    setCarregando(true); setMensagem("");
    try {
      const params = new URLSearchParams({ escolaId,turmaId,disciplinaId,anoLetivo:String(anoLetivo),bimestre:String(bimestre) });
      const response = await fetch(`/api/caderno-dev?${params}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Não foi possível carregar a tabela");
      const dados = json.data as Caderno;
      setCaderno(dados); setComponentes(dados.componentes);
      const indices = new Map(dados.componentes.map((item,indice) => [item.id,indice]));
      const novos: Record<string,string[]> = Object.fromEntries(dados.alunos.map((aluno) => [aluno.matriculaId, dados.componentes.map(() => "")]));
      dados.resultados.forEach((item) => { const indice = indices.get(item.componenteId); if (indice !== undefined && novos[item.matriculaId]) novos[item.matriculaId][indice] = String(item.nota); });
      setValores(novos); setAlterado(false);
    } catch (error) { setMensagem(error instanceof Error ? error.message : "Erro ao carregar a tabela"); }
    finally { setCarregando(false); }
  }, [escolaId,turmaId,disciplinaId,anoLetivo,bimestre]);

  useEffect(() => {
    if (!disciplinaId) return;
    const temporizador = window.setTimeout(() => void carregarCaderno(), 0);
    return () => window.clearTimeout(temporizador);
  }, [disciplinaId,bimestre,anoLetivo,carregarCaderno]);

  function atualizarComponente(indice: number, campoNome: "nome"|"peso", valor: string) {
    setComponentes((atuais) => atuais.map((item,i) => i === indice ? { ...item, [campoNome]: campoNome === "peso" ? (valor === "" ? null : Number(valor)) : valor } : item));
    setAlterado(true);
  }
  function adicionarComponente() {
    if (componentes.length >= 12) return;
    setComponentes((atuais) => [...atuais,{ id:`novo-${Date.now()}`,nome:"Nova atividade",peso:null,notaMaxima:10,ordem:atuais.length+1 }]);
    setValores((atuais) => Object.fromEntries(Object.entries(atuais).map(([id,lista]) => [id,[...lista,""]]))); setAlterado(true);
  }
  function removerComponente(indice: number) {
    if (componentes.length === 1) return;
    setComponentes((atuais) => atuais.filter((_,i) => i !== indice).map((item,i) => ({ ...item,ordem:i+1 })));
    setValores((atuais) => Object.fromEntries(Object.entries(atuais).map(([id,lista]) => [id,lista.filter((_,i) => i !== indice)]))); setAlterado(true);
  }
  function restaurarModelo() {
    if (!caderno) return;
    const modelo = componentesPadrao(caderno.disciplinaNome).map((item,indice) => ({ id:`novo-${Date.now()}-${indice}`,...item,ordem:indice+1 }));
    setComponentes(modelo); setValores(Object.fromEntries(caderno.alunos.map((aluno) => [aluno.matriculaId,modelo.map(() => "")]))); setAlterado(true);
  }
  function atualizarNota(matriculaId: string, indice: number, valor: string) {
    if (valor !== "" && !/^\d{0,2}([.,]\d{0,2})?$/.test(valor)) return;
    const numero = Number(valor.replace(",",".")); if (valor !== "" && (numero < 0 || numero > (componentes[indice]?.notaMaxima ?? 10))) return;
    setValores((atuais) => ({ ...atuais,[matriculaId]:(atuais[matriculaId] ?? componentes.map(() => "")).map((item,i) => i === indice ? valor : item) })); setAlterado(true);
  }
  async function salvar() {
    if (!caderno || !componentes.every((item) => item.nome.trim())) return setMensagem("Preencha o nome de todas as colunas.");
    setSalvando(true); setMensagem("");
    try {
      const notas = caderno.alunos.map((aluno) => ({ matriculaId: aluno.matriculaId, valores: (valores[aluno.matriculaId] ?? []).map((item) => item === "" ? null : Number(item.replace(",","."))) }));
      const response = await fetch("/api/caderno-dev", { method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ escolaId,turmaId,disciplinaId,anoLetivo,bimestre,componentes,notas }) });
      const json = await response.json(); if (!response.ok) throw new Error(json.error ?? "Não foi possível salvar");
      setMensagem("Caderno salvo. Nenhuma nota oficial foi alterada."); await carregarCaderno();
    } catch (error) { setMensagem(error instanceof Error ? error.message : "Erro ao salvar"); }
    finally { setSalvando(false); }
  }

  const todasComPeso = componentes.length > 0 && componentes.every((item) => item.peso !== null && Number(item.peso) > 0);
  const turmasDoProfessor = (opcoes?.turmas ?? []).filter((turma) => !(turma.etapa === "EM" && turma.anoSerie === 1));
  const disciplinasDisponiveis = disciplinasDoProfessor(opcoes?.turmas.find((item) => item.id === turmaId),opcoes?.disciplinas ?? []);
  const somaPesos = componentes.reduce((soma,item) => soma + (Number(item.peso) || 0),0);
  const medias = useMemo(() => caderno?.alunos.map((aluno) => {
    const lista = (valores[aluno.matriculaId] ?? []).map((item) => item === "" ? null : Number(item.replace(",",".")));
    return [aluno.matriculaId,calcularNotaCaderno(componentes,lista).nota] as const;
  }) ?? [], [caderno,componentes,valores]);
  const mediaTurma = medias.filter((item): item is readonly [string,number] => item[1] !== null).reduce((soma,item) => soma+item[1],0) / (medias.filter((item) => item[1] !== null).length || 1);

  if (!carregandoUsuario && !isDevMaster) return <main className="min-h-screen p-8" style={{ background:"var(--bg-app)",color:"var(--text-primary)" }}><div className="mx-auto max-w-xl rounded-2xl p-8 text-center" style={card}><ShieldCheck className="mx-auto h-10 w-10" /><h1 className="mt-3 text-xl font-bold">Área exclusiva do Dev Master</h1></div></main>;
  return <main className="min-h-screen p-4 md:p-8" style={{ background:"var(--bg-app)",color:"var(--text-primary)" }}><div className="mx-auto max-w-[1600px]">
    <header className="nao-imprimir overflow-hidden rounded-3xl p-6 md:p-8" style={{ ...card,background:"radial-gradient(circle at 90% 0%,rgba(59,130,246,.20),transparent 38%),var(--bg-card)" }}><div className="flex flex-wrap items-start justify-between gap-5"><div><span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider" style={{ background:"var(--bg-sidebar-active)",color:"var(--brand-primary)" }}><BookOpenCheck className="h-4 w-4" /> Caderno particular · Dev Master</span><h1 className="mt-4 text-3xl font-black md:text-4xl">Planejamento de notas</h1><p className="mt-2 max-w-3xl" style={{ color:"var(--text-secondary)" }}>Registre atividades e simule a nota final antes de lançar no sistema oficial. Este caderno não altera boletins, gráficos ou médias públicas.</p></div><FileSpreadsheet className="h-14 w-14" style={{ color:"var(--brand-primary)" }} /></div></header>

    <section className="nao-imprimir mt-5 rounded-3xl p-5" style={card}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><label className="flex min-w-0 flex-col gap-2 text-xs font-bold [&>div]:w-full">Escola<StyledSelect value={escolaId} onChange={(event) => void selecionarEscola(event.target.value)} className="w-full rounded-xl px-3 py-2.5">{(opcoes?.escolas ?? []).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</StyledSelect></label><label className="flex min-w-0 flex-col gap-2 text-xs font-bold [&>div]:w-full">Turma<StyledSelect value={turmaId} onChange={(event) => void selecionarTurma(event.target.value)} className="w-full rounded-xl px-3 py-2.5">{turmasDoProfessor.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</StyledSelect></label><label className="flex min-w-0 flex-col gap-2 text-xs font-bold [&>div]:w-full">Minha disciplina<StyledSelect value={disciplinaId} onChange={(event) => setDisciplinaId(event.target.value)} className="w-full rounded-xl px-3 py-2.5">{disciplinasDisponiveis.map((item) => <option key={item.id} value={item.id}>{item.codigo} · {item.nome}</option>)}</StyledSelect></label><label className="flex min-w-0 flex-col gap-2 text-xs font-bold [&>div]:w-full">Ano letivo<input type="number" value={anoLetivo} onChange={(event) => setAnoLetivo(Number(event.target.value))} className="w-full rounded-xl px-3 py-2.5" style={campo} /></label><label className="flex min-w-0 flex-col gap-2 text-xs font-bold [&>div]:w-full">Bimestre<StyledSelect value={String(bimestre)} onChange={(event) => setBimestre(Number(event.target.value))} className="w-full rounded-xl px-3 py-2.5">{[1,2,3,4].map((item) => <option key={item} value={item}>{item}º bimestre</option>)}</StyledSelect></label></div></section>

    {mensagem && <p className="nao-imprimir mt-4 rounded-xl border px-4 py-3 text-sm font-bold" style={{ borderColor:mensagem.startsWith("Caderno salvo")?"var(--status-success-bg)":"var(--status-warning-bg)",color:mensagem.startsWith("Caderno salvo")?"var(--status-success-bg)":"var(--status-warning-bg)",background:"var(--bg-card)" }}>{mensagem}</p>}
    {carregando && <p className="py-14 text-center" style={{ color:"var(--text-secondary)" }}>Carregando o caderno...</p>}

    {!carregando && caderno && <section className="mt-5">
      <header className="cabecalho-relatorio mb-4 flex flex-wrap items-end justify-between gap-4 border-b-2 pb-4" style={{ borderColor:"var(--text-primary)" }}><div><p className="text-xs font-black uppercase tracking-[.15em]" style={{ color:"var(--brand-primary)" }}>Caderno particular do {bimestre}º bimestre</p><h2 className="mt-1 text-2xl font-black">{caderno.codigoCurricular} · {caderno.disciplinaNome}</h2><p className="mt-1 text-sm" style={{ color:"var(--text-secondary)" }}>{caderno.escolaNome} · {caderno.turmaNome} · {bimestre}º bimestre · {anoLetivo}</p></div><div className="nao-imprimir flex flex-wrap gap-2"><button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold" style={campo}><Printer className="h-4 w-4" /> Imprimir</button><button onClick={() => void salvar()} disabled={salvando || !alterado} className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-black text-white disabled:opacity-50" style={{ background:"var(--brand-primary-solid)" }}><Save className="h-4 w-4" /> {salvando?"Salvando...":"Salvar caderno"}</button></div></header>

      <div className="nao-imprimir mb-4 rounded-2xl p-4" style={card}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 font-black"><Settings2 className="h-4 w-4" /> Colunas e pesos</h3><p className="mt-1 text-xs" style={{ color:"var(--text-secondary)" }}>Deixe o peso vazio enquanto ele não estiver definido. A prévia usa média simples até todos os pesos serem preenchidos.</p></div><div className="flex gap-2"><button onClick={restaurarModelo} className="rounded-lg border px-3 py-2 text-xs font-bold" style={campo}>Restaurar modelo</button><button onClick={adicionarComponente} disabled={componentes.length>=12} className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50" style={{ background:"var(--brand-primary-solid)" }}><Plus className="h-3 w-3" /> Coluna</button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{componentes.map((item,indice) => <div key={item.id} className="rounded-xl border p-3" style={{ borderColor:"var(--border-subtle)" }}><input value={item.nome} onChange={(event) => atualizarComponente(indice,"nome",event.target.value)} maxLength={60} className="w-full rounded-lg px-2 py-2 text-sm font-bold" style={campo} /><div className="mt-2 flex items-center gap-2"><label className="flex-1 text-[11px]" style={{ color:"var(--text-secondary)" }}>Peso opcional<input type="number" min="0.01" max="100" step="0.01" value={item.peso??""} onChange={(event) => atualizarComponente(indice,"peso",event.target.value)} className="mt-1 w-full rounded-lg px-2 py-1.5" style={campo} /></label><button onClick={() => removerComponente(indice)} disabled={componentes.length===1} title="Remover coluna" className="mt-4 rounded-lg p-2 disabled:opacity-30" style={{ color:"var(--status-danger-bg)" }}><Trash2 className="h-4 w-4" /></button></div></div>)}</div><div className="mt-3 flex flex-wrap gap-3 text-xs font-bold"><span className="rounded-full px-3 py-1" style={{ background:"var(--bg-sidebar-active)",color:"var(--brand-primary)" }}><Calculator className="mr-1 inline h-3 w-3" /> Cálculo: {todasComPeso?"média ponderada":"média simples provisória"}</span>{todasComPeso && <span style={{ color:"var(--text-secondary)" }}>Soma dos pesos: {somaPesos.toLocaleString("pt-BR")}</span>}<span style={{ color:"var(--text-secondary)" }}>A nota oficial permanece intacta.</span></div></div>

      <div className="overflow-x-auto rounded-2xl border" style={card}><table className="report-table tabela-caderno-dev w-full min-w-[980px] text-sm"><thead style={{ background:"var(--bg-app)",color:"var(--text-secondary)" }}><tr><th className="sticky left-0 z-10 px-3 py-3 text-center">Nº</th><th className="sticky left-[54px] z-10 min-w-[250px] px-4 py-3 text-left">Nome do aluno</th>{componentes.map((item) => <th key={item.id} className="min-w-[115px] px-3 py-3 text-center"><span className="block">{item.nome}</span>{item.peso && <small className="font-medium">peso {item.peso}</small>}</th>)}<th className="min-w-[105px] px-4 py-3 text-center">Nota final</th></tr></thead><tbody>{caderno.alunos.map((aluno) => { const resultado = calcularNotaCaderno(componentes,(valores[aluno.matriculaId]??[]).map((item) => item===""?null:Number(item.replace(",",".")))); return <tr key={aluno.matriculaId} className="border-t" style={{ borderColor:"var(--border-subtle)",breakInside:"avoid" }}><td className="sticky left-0 px-3 py-2 text-center font-bold" style={{ background:"var(--bg-card)" }}>{aluno.numeroChamada}</td><td className="sticky left-[54px] px-4 py-2 font-bold" style={{ background:"var(--bg-card)" }}>{aluno.nome}</td>{componentes.map((item,indice) => <td key={item.id} className="px-2 py-2 text-center"><input inputMode="decimal" aria-label={`${aluno.nome} - ${item.nome}`} value={valores[aluno.matriculaId]?.[indice]??""} onChange={(event) => atualizarNota(aluno.matriculaId,indice,event.target.value)} className="nota-caderno-input w-20 rounded-lg px-2 py-2 text-center font-bold" style={campo} /></td>)}<td className="px-4 py-2 text-center text-lg font-black" style={{ color:corNota(resultado.nota) }}>{notaTexto(resultado.nota)}</td></tr>})}</tbody><tfoot><tr><td colSpan={2+componentes.length} className="px-4 py-3 text-right font-black">Média da turma</td><td className="px-4 py-3 text-center text-lg font-black" style={{ color:corNota(Number.isFinite(mediaTurma)?mediaTurma:null) }}>{medias.some((item) => item[1]!==null)?notaTexto(mediaTurma):"—"}</td></tr></tfoot></table></div>
      {!caderno.alunos.length && <p className="p-10 text-center" style={{ color:"var(--text-secondary)" }}>Nenhum aluno ativo encontrado nesta turma.</p>}
    </section>}
  </div></main>;
}

export default function Page() { return <AuthGuard allow={["DEV_MASTER"]}><Conteudo /></AuthGuard>; }
