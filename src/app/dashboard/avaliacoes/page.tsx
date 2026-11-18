"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Save } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { rolesWithCapability } from "../../../types/roles";

const ROLES = rolesWithCapability("manageNotas");
type Escola = { id: string; nome: string; ano_letivo: number; bimestre_atual: number };
type Turma = { id: string; nome: string };
type Disciplina = { id: string; nome: string; codigo: string };
type Aluno = { id: string; nome: string; matricula_id: string; numero_chamada: number };
type Nota = { matricula_id: string; nota: number | string };
type Avaliacao = { id: string; nome: string; tipo: string; peso: number | string; nota_maxima: number | string; data_avaliacao: string | null; ativo: boolean; resultados: number };
type Resultado = { matricula_id: string; nota: number | string | null; ausente: boolean; observacao: string | null };
type Recuperacao = { matricula_id: string; tipo: string; criterio: string; nota_anterior: number | string; nota_recuperacao: number | string; nota_final: number | string };

const field: React.CSSProperties = {
  background: "var(--bg-app)", border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
};
const card: React.CSSProperties = { ...field, background: "var(--bg-card)", boxShadow: "var(--shadow-card)" };

function AvaliacoesConteudo() {
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [recuperacoes, setRecuperacoes] = useState<Recuperacao[]>([]);
  const [escolaId, setEscolaId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());
  const [bimestre, setBimestre] = useState(1);
  const [avaliacaoId, setAvaliacaoId] = useState("");
  const [resultados, setResultados] = useState<Record<string, { nota: string; ausente: boolean }>>({});
  const [valoresRecuperacao, setValoresRecuperacao] = useState<Record<string, string>>({});
  const [criterio, setCriterio] = useState("MAIOR_NOTA");
  const [tipoRecuperacao, setTipoRecuperacao] = useState("BIMESTRAL");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("PROVA");
  const [peso, setPeso] = useState("1");
  const [notaMaxima, setNotaMaxima] = useState("10");
  const [dataAvaliacao, setDataAvaliacao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const contexto = useMemo(() => ({ escolaId, turmaId, disciplinaId, anoLetivo, bimestre }), [escolaId, turmaId, disciplinaId, anoLetivo, bimestre]);
  const avaliacaoSelecionada = avaliacoes.find((item) => item.id === avaliacaoId);
  const recuperacoesPorMatricula = useMemo(() => new Map(recuperacoes.map((item) => [item.matricula_id, item])), [recuperacoes]);

  async function jsonDaResposta(response: Response) {
    const json = await response.json();
    if (!response.ok) throw new Error(json.error ?? "Erro na operação");
    return json;
  }

  async function carregarEscolas(id?: string) {
    setCarregando(true); setErro(null);
    try {
      let json = await jsonDaResposta(await fetch(`/api/diario?${id ? new URLSearchParams({ escolaId: id }) : ""}`, { cache: "no-store" }));
      const lista = (json.escolas ?? []) as Escola[];
      const selecionada = json.escolaId ?? id ?? lista[0]?.id ?? "";
      if (!json.escolaId && selecionada) json = await jsonDaResposta(await fetch(`/api/diario?${new URLSearchParams({ escolaId: selecionada })}`, { cache: "no-store" }));
      setEscolas(lista); setEscolaId(selecionada);
      setAnoLetivo(Number(json.anoLetivo ?? lista.find((item) => item.id === selecionada)?.ano_letivo ?? new Date().getFullYear()));
      setBimestre(Number(json.bimestre ?? lista.find((item) => item.id === selecionada)?.bimestre_atual ?? 1));
      setTurmas(json.turmas ?? []); setTurmaId(""); setDisciplinas([]); setDisciplinaId("");
      setAlunos([]); setAvaliacoes([]); setRecuperacoes([]);
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setCarregando(false); }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarEscolas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selecionarTurma(id: string) {
    setTurmaId(id); setDisciplinaId(""); setDisciplinas([]); setAlunos([]); setAvaliacoes([]); setErro(null); setMensagem(null);
    if (!id) return;
    setCarregando(true);
    try {
      const params = new URLSearchParams({ escolaId, turmaId: id, anoLetivo: String(anoLetivo), bimestre: String(bimestre) });
      const json = await jsonDaResposta(await fetch(`/api/diario?${params}`, { cache: "no-store" }));
      setDisciplinas(json.disciplinas ?? []);
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setCarregando(false); }
  }

  async function carregarContexto() {
    if (!escolaId || !turmaId || !disciplinaId) return;
    setCarregando(true); setErro(null); setMensagem(null);
    try {
      const params = new URLSearchParams({ escolaId, turmaId, disciplinaId, anoLetivo: String(anoLetivo), bimestre: String(bimestre) });
      const [diario, avs, recs] = await Promise.all([
        fetch(`/api/diario?${params}`, { cache: "no-store" }).then(jsonDaResposta),
        fetch(`/api/avaliacoes?${params}`, { cache: "no-store" }).then(jsonDaResposta),
        fetch(`/api/recuperacoes?${params}`, { cache: "no-store" }).then(jsonDaResposta),
      ]);
      setAlunos(diario.alunos ?? []);
      setNotas(Object.fromEntries(((diario.notas ?? []) as Nota[]).map((item) => [item.matricula_id, Number(item.nota)])));
      setAvaliacoes(avs.avaliacoes ?? []); setRecuperacoes(recs.recuperacoes ?? []);
      setAvaliacaoId(""); setResultados({}); setValoresRecuperacao({});
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setCarregando(false); }
  }

  async function selecionarAvaliacao(id: string) {
    setAvaliacaoId(id); setResultados({}); setErro(null); setMensagem(null);
    if (!id) return;
    setCarregando(true);
    try {
      const params = new URLSearchParams({ ...Object.fromEntries(Object.entries(contexto).map(([chave, valor]) => [chave, String(valor)])), avaliacaoId: id });
      const json = await jsonDaResposta(await fetch(`/api/avaliacoes?${params}`, { cache: "no-store" }));
      setResultados(Object.fromEntries(((json.resultados ?? []) as Resultado[]).map((item) => [
        item.matricula_id, { nota: item.nota === null ? "" : String(item.nota), ausente: item.ausente },
      ])));
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setCarregando(false); }
  }

  async function criarAvaliacao() {
    setSalvando(true); setErro(null); setMensagem(null);
    try {
      const response = await fetch("/api/avaliacoes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contexto, nome, tipo, peso: Number(peso.replace(",", ".")), notaMaxima: Number(notaMaxima.replace(",", ".")), dataAvaliacao }),
      });
      const json = await jsonDaResposta(response);
      setNome(""); setDataAvaliacao("");
      await carregarContexto();
      setAvaliacaoId(json.avaliacao.id);
      setMensagem("Avaliação criada e registrada na auditoria.");
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setSalvando(false); }
  }

  async function salvarResultados() {
    if (!avaliacaoId) return;
    setSalvando(true); setErro(null); setMensagem(null);
    try {
      const lista = Object.entries(resultados).flatMap(([matriculaId, item]) => {
        if (!item.ausente && !item.nota.trim()) return [];
        const nota = item.ausente ? null : Number(item.nota.replace(",", "."));
        return [{ matriculaId, nota, ausente: item.ausente }];
      });
      if (lista.length === 0) throw new Error("Informe pelo menos um resultado ou ausência.");
      const response = await fetch("/api/avaliacoes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contexto, acao: "SALVAR_RESULTADOS", avaliacaoId, resultados: lista }),
      });
      const json = await jsonDaResposta(response);
      await carregarContexto();
      setMensagem(`${json.resumo.resultados} resultado(s) salvo(s) e ${json.resumo.notasRecalculadas} nota(s) recalculada(s).`);
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setSalvando(false); }
  }

  async function aplicarRecuperacoes() {
    setSalvando(true); setErro(null); setMensagem(null);
    try {
      const lista = Object.entries(valoresRecuperacao).flatMap(([matriculaId, valor]) => {
        if (!valor.trim()) return [];
        return [{ matriculaId, notaRecuperacao: Number(valor.replace(",", ".")) }];
      });
      if (lista.length === 0) throw new Error("Informe pelo menos uma nota de recuperação.");
      const response = await fetch("/api/recuperacoes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contexto, tipo: tipoRecuperacao, criterio, recuperacoes: lista }),
      });
      const json = await jsonDaResposta(response);
      await carregarContexto();
      setMensagem(`${json.resumo.recuperacoes} recuperação(ões) aplicada(s) e auditada(s).`);
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro inesperado"); }
    finally { setSalvando(false); }
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3"><ClipboardCheck className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
        <div><h1 className="text-2xl font-bold">Avaliações e recuperação</h1><p className="text-sm" style={{ color: "var(--text-secondary)" }}>Resultados detalhados, média ponderada e recuperação real.</p></div>
      </div>
      {(erro || mensagem) && <div className="mt-4 p-3 text-sm" style={{ ...field, color: erro ? "var(--status-danger-bg)" : "var(--status-success-bg)" }}>{erro ?? mensagem}</div>}

      <section className="mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" style={card}>
        <StyledSelect value={escolaId} onChange={(event) => void carregarEscolas(event.target.value)} className="p-2 text-sm" style={field} disabled={escolas.length <= 1}>{escolas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</StyledSelect>
        <StyledSelect value={turmaId} onChange={(event) => void selecionarTurma(event.target.value)} className="p-2 text-sm" style={field}><option value="">Turma</option>{turmas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</StyledSelect>
        <StyledSelect value={disciplinaId} onChange={(event) => { setDisciplinaId(event.target.value); setAlunos([]); }} className="p-2 text-sm" style={field}><option value="">Disciplina</option>{disciplinas.map((item) => <option key={item.id} value={item.id}>{item.codigo} · {item.nome}</option>)}</StyledSelect>
        <input type="number" min={2000} max={2100} value={anoLetivo} onChange={(event) => setAnoLetivo(Number(event.target.value))} className="p-2 text-sm" style={field} aria-label="Ano letivo" />
        <StyledSelect value={bimestre} onChange={(event) => setBimestre(Number(event.target.value))} className="p-2 text-sm" style={field}>{[1,2,3,4].map((item) => <option key={item} value={item}>{item}º bimestre</option>)}</StyledSelect>
        <button onClick={() => void carregarContexto()} disabled={carregando || !disciplinaId} className="p-2 text-sm font-semibold disabled:opacity-50" style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary-solid)", color: "var(--status-text-on-color)" }}>{carregando ? "Carregando..." : "Carregar"}</button>
      </section>

      {alunos.length > 0 && <>
        <section className="mt-6 p-4" style={card}>
          <h2 className="text-lg font-semibold">1. Criar avaliação</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-6">
            <input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Nome da avaliação" className="p-2 text-sm md:col-span-2" style={field} />
            <StyledSelect value={tipo} onChange={(event) => setTipo(event.target.value)} className="p-2 text-sm" style={field}>{["PROVA","ATIVIDADE","TRABALHO","SIMULADO","OUTRA"].map((item) => <option key={item}>{item}</option>)}</StyledSelect>
            <input value={peso} onChange={(event) => setPeso(event.target.value)} placeholder="Peso" inputMode="decimal" className="p-2 text-sm" style={field} aria-label="Peso" />
            <input value={notaMaxima} onChange={(event) => setNotaMaxima(event.target.value)} placeholder="Nota máxima" inputMode="decimal" className="p-2 text-sm" style={field} aria-label="Nota máxima" />
            <input type="date" value={dataAvaliacao} onChange={(event) => setDataAvaliacao(event.target.value)} className="p-2 text-sm" style={field} aria-label="Data da avaliação" />
          </div>
          <button onClick={() => void criarAvaliacao()} disabled={salvando || !nome.trim()} className="mt-3 px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary-solid)", color: "var(--status-text-on-color)" }}>Criar avaliação</button>
        </section>

        <section className="mt-6 p-4" style={card}>
          <h2 className="text-lg font-semibold">2. Lançar resultados</h2>
          <StyledSelect value={avaliacaoId} onChange={(event) => void selecionarAvaliacao(event.target.value)} className="mt-3 w-full max-w-xl p-2 text-sm" style={field}>
            <option value="">Selecione uma avaliação</option>
            {avaliacoes.filter((item) => item.ativo).map((item) => <option key={item.id} value={item.id}>{item.nome} · peso {item.peso} · máxima {item.nota_maxima}</option>)}
          </StyledSelect>
          {avaliacaoSelecionada && <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-sm">
            <thead style={{ color: "var(--text-secondary)" }}><tr><th className="p-2 text-left">Nº</th><th className="p-2 text-left">Aluno</th><th className="p-2 text-left">Resultado / {avaliacaoSelecionada.nota_maxima}</th><th className="p-2 text-left">Ausente</th></tr></thead>
            <tbody>{alunos.map((aluno) => {
              const atual = resultados[aluno.matricula_id] ?? { nota: "", ausente: false };
              return <tr key={aluno.matricula_id} style={{ borderTop: "1px solid var(--border-subtle)" }}><td className="p-2">{aluno.numero_chamada}</td><td className="p-2">{aluno.nome}</td>
                <td className="p-2"><input value={atual.nota} disabled={atual.ausente} onChange={(event) => setResultados((estado) => ({ ...estado, [aluno.matricula_id]: { ...atual, nota: event.target.value } }))} inputMode="decimal" className="w-28 p-2 disabled:opacity-50" style={field} aria-label={`Resultado de ${aluno.nome}`} /></td>
                <td className="p-2"><input type="checkbox" checked={atual.ausente} onChange={(event) => setResultados((estado) => ({ ...estado, [aluno.matricula_id]: { nota: "", ausente: event.target.checked } }))} aria-label={`Ausência de ${aluno.nome}`} /></td></tr>;
            })}</tbody>
          </table><button onClick={() => void salvarResultados()} disabled={salvando} className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary-solid)", color: "var(--status-text-on-color)" }}><Save className="h-4 w-4" />Salvar resultados e recalcular médias</button></div>}
        </section>

        <section className="mt-6 p-4" style={card}>
          <h2 className="text-lg font-semibold">3. Aplicar recuperação</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>A nota anterior vem do diário e fica preservada no histórico.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <StyledSelect value={tipoRecuperacao} onChange={(event) => setTipoRecuperacao(event.target.value)} className="p-2 text-sm" style={field}><option value="PARALELA">Paralela</option><option value="BIMESTRAL">Bimestral</option><option value="FINAL">Final</option></StyledSelect>
            <StyledSelect value={criterio} onChange={(event) => setCriterio(event.target.value)} className="p-2 text-sm" style={field}><option value="MAIOR_NOTA">Manter a maior nota</option><option value="MEDIA_ARITMETICA">Média entre anterior e recuperação</option><option value="SUBSTITUICAO">Substituir pela recuperação</option></StyledSelect>
          </div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead style={{ color: "var(--text-secondary)" }}><tr><th className="p-2 text-left">Nº</th><th className="p-2 text-left">Aluno</th><th className="p-2 text-left">Nota atual</th><th className="p-2 text-left">Recuperação</th><th className="p-2 text-left">Última aplicação</th></tr></thead>
            <tbody>{alunos.map((aluno) => { const rec = recuperacoesPorMatricula.get(aluno.matricula_id); return <tr key={aluno.matricula_id} style={{ borderTop: "1px solid var(--border-subtle)" }}><td className="p-2">{aluno.numero_chamada}</td><td className="p-2">{aluno.nome}</td><td className="p-2">{notas[aluno.matricula_id] ?? "-"}</td><td className="p-2"><input value={valoresRecuperacao[aluno.matricula_id] ?? ""} onChange={(event) => setValoresRecuperacao((estado) => ({ ...estado, [aluno.matricula_id]: event.target.value }))} inputMode="decimal" className="w-28 p-2" style={field} aria-label={`Recuperação de ${aluno.nome}`} /></td><td className="p-2 text-xs" style={{ color: "var(--text-secondary)" }}>{rec ? `${rec.nota_anterior} → ${rec.nota_recuperacao} → ${rec.nota_final}` : "-"}</td></tr>; })}</tbody>
          </table></div>
          <button onClick={() => void aplicarRecuperacoes()} disabled={salvando} className="mt-4 px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary-solid)", color: "var(--status-text-on-color)" }}>Aplicar recuperações informadas</button>
        </section>
      </>}
    </main>
  );
}

export default function AvaliacoesPage() {
  return <AuthGuard allow={ROLES}><AvaliacoesConteudo /></AuthGuard>;
}
