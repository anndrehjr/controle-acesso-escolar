"use client";

import { useEffect, useState } from "react";
import { Download, FileBarChart, Printer } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { useUsuarioAtual } from "../../../hooks/useUsuarioAtual";
import { rolesWithCapability } from "../../../types/roles";

const ROLES = rolesWithCapability("viewReports");
const TIPOS: Record<string, string> = {
  turma: "Relatório por turma",
  disciplina: "Relatório por disciplina",
  aluno: "Histórico por aluno",
  recuperacao: "Relatório de recuperação",
  evolucao: "Evolução entre bimestres",
  risco: "Indicadores objetivos de risco",
  intervencao: "Alunos que precisam de intervenção",
};
type Escola = { id: string; nome: string; ano_letivo: number; bimestre_atual: number };
type Turma = { id: string; nome: string };
type Disciplina = { id: string; nome: string; codigo: string };
type Aluno = { id: string; nome: string; numero_chamada: number; status: string };
type Opcoes = { escolas: Escola[]; escolaId: string | null; anoLetivo?: number; bimestre?: number; turmas: Turma[]; disciplinas: Disciplina[]; alunos: Aluno[] };
type Relatorio = {
  metadados: Record<string, string | number>;
  linhas: Array<Record<string, string | number | null>>;
  resumo: { registros: number; mediaGeral: number | null; abaixoMedia: number; recuperacoes: number };
  indice: null | { indice: number; mediaNormalizada: number; percentualAcimaMedia: number; evolucaoNormalizada: number; variacaoMedia: number | null; totalNotas: number; paresComparaveis: number; experimental: true };
  intervencao?: null | {
    mediaLimite: number;
    minimoDisciplinas: number;
    alunos: Array<{
      alunoId: string; aluno: string; turma: string; numeroChamada: number; mediaGeral: number;
      disciplinas: Array<{ disciplina: string; b1: number | null; b2: number | null; b3: number | null; b4: number | null; media: number }>;
    }>;
  };
};

const field: React.CSSProperties = {
  background: "var(--bg-app)", border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
};
const card: React.CSSProperties = { ...field, background: "var(--bg-card)", boxShadow: "var(--shadow-card)" };
const formatar = (valor: string | number | null) =>
  valor === null || valor === "" ? "—" : typeof valor === "number" ? valor.toLocaleString("pt-BR") : valor;

function RelatoriosConteudo() {
  const { usuario } = useUsuarioAtual();
  const somenteIntervencao = usuario?.role === "ADMIN_ESCOLA";
  const filtroMateriaIntervencao = usuario?.role === "DEV_MASTER" && usuario.is_dev_master === true;
  const [opcoes, setOpcoes] = useState<Opcoes>({ escolas: [], escolaId: null, turmas: [], disciplinas: [], alunos: [] });
  const [escolaId, setEscolaId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());
  const [bimestre, setBimestre] = useState("");
  const [situacao, setSituacao] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("turma");
  const tipo = somenteIntervencao ? "intervencao" : tipoSelecionado;
  const [modoIntervencao, setModoIntervencao] = useState<"completo" | "compacto">("completo");
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function lerResposta(response: Response) {
    const json = await response.json();
    if (!response.ok) throw new Error(json.error ?? "Erro ao carregar relatório");
    return json;
  }

  async function carregarOpcoes(novaEscola = escolaId, novaTurma = turmaId) {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams({ opcoes: "1", anoLetivo: String(anoLetivo) });
      if (novaEscola) params.set("escolaId", novaEscola);
      if (novaTurma) params.set("turmaId", novaTurma);
      let json = await lerResposta(await fetch("/api/relatorios?" + params.toString(), { cache: "no-store" })) as Opcoes;
      const selecionada = json.escolaId ?? novaEscola ?? json.escolas[0]?.id ?? "";
      if (!json.escolaId && selecionada) {
        params.set("escolaId", selecionada);
        json = await lerResposta(await fetch("/api/relatorios?" + params.toString(), { cache: "no-store" })) as Opcoes;
      }
      setOpcoes(json);
      setEscolaId(selecionada);
      if (!novaEscola && json.anoLetivo) setAnoLetivo(Number(json.anoLetivo));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarOpcoes("", "");
    // A carga inicial usa os valores padrão; as demais cargas são acionadas pelos filtros.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function parametros(formato?: string) {
    const params = new URLSearchParams({ escolaId, anoLetivo: String(anoLetivo), tipo });
    if (turmaId) params.set("turmaId", turmaId);
    if (disciplinaId && (tipo !== "intervencao" || filtroMateriaIntervencao)) params.set("disciplinaId", disciplinaId);
    if (tipo !== "intervencao" && alunoId) params.set("alunoId", alunoId);
    if (bimestre) params.set("bimestre", bimestre);
    if (tipo !== "intervencao" && situacao) params.set("situacao", situacao);
    if (formato) params.set("formato", formato);
    return params;
  }

  async function gerar() {
    if (!escolaId) return;
    setCarregando(true);
    setErro(null);
    try {
      const json = await lerResposta(await fetch("/api/relatorios?" + parametros().toString(), { cache: "no-store" }));
      setRelatorio(json as Relatorio);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  const cabecalhos = relatorio?.linhas[0] ? Object.keys(relatorio.linhas[0]) : [];

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div className="nao-imprimir flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileBarChart className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
          <div>
            <h1 className="text-2xl font-bold">Relatórios oficiais</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Filtros autorizados, CSV e impressão/PDF.</p>
          </div>
        </div>
      </div>

      {erro && <div className="nao-imprimir mt-4 p-3 text-sm" style={{ ...field, color: "var(--status-danger-bg)" }}>{erro}</div>}

      <section className="nao-imprimir mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6" style={card}>
        <StyledSelect value={escolaId} disabled={opcoes.escolas.length <= 1} onChange={(event) => {
          const id = event.target.value; setEscolaId(id); setTurmaId(""); setDisciplinaId(""); setAlunoId(""); setRelatorio(null); void carregarOpcoes(id, "");
        }} className="p-2 text-sm" style={field}>
          {opcoes.escolas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </StyledSelect>
        <StyledSelect value={tipo} disabled={somenteIntervencao} onChange={(event) => { setTipoSelecionado(event.target.value); setRelatorio(null); }} className="p-2 text-sm" style={field}>
          {(somenteIntervencao ? [["intervencao", TIPOS.intervencao]] : Object.entries(TIPOS)).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </StyledSelect>
        <input type="number" min={2000} max={2100} value={anoLetivo} onChange={(event) => setAnoLetivo(Number(event.target.value))} className="p-2 text-sm" style={field} aria-label="Ano letivo" />
        <StyledSelect value={bimestre} onChange={(event) => setBimestre(event.target.value)} className="p-2 text-sm" style={field}>
          <option value="">Todos os bimestres</option>{[1,2,3,4].map((item) => <option key={item} value={item}>{tipo === "intervencao" ? `Até o ${item}º bimestre` : `${item}º bimestre`}</option>)}
        </StyledSelect>
        <StyledSelect value={turmaId} onChange={(event) => {
          const id = event.target.value; setTurmaId(id); setDisciplinaId(""); setAlunoId(""); setRelatorio(null); void carregarOpcoes(escolaId, id);
        }} className="p-2 text-sm" style={field}>
          <option value="">Todas as turmas</option>{opcoes.turmas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </StyledSelect>
        {(tipo !== "intervencao" || filtroMateriaIntervencao) && <StyledSelect value={disciplinaId} onChange={(event) => { setDisciplinaId(event.target.value); setRelatorio(null); }} className="p-2 text-sm" style={field} disabled={opcoes.disciplinas.length === 0}>
          <option value="">Todas as matérias</option>{opcoes.disciplinas.map((item) => <option key={item.id} value={item.id}>{item.codigo} · {item.nome}</option>)}
        </StyledSelect>}
        {tipo !== "intervencao" && <StyledSelect value={alunoId} onChange={(event) => setAlunoId(event.target.value)} className="p-2 text-sm" style={field} disabled={!turmaId}>
          <option value="">Todos os alunos</option>{opcoes.alunos.map((item) => <option key={item.id} value={item.id}>{item.numero_chamada} · {item.nome}</option>)}
        </StyledSelect>}
        {tipo !== "intervencao" && <StyledSelect value={situacao} onChange={(event) => setSituacao(event.target.value)} className="p-2 text-sm" style={field}>
          <option value="">Todas as situações</option><option value="ATIVA">Ativa</option><option value="TRANSFERIDA">Transferida</option><option value="CONCLUIDA">Concluída</option><option value="CANCELADA">Cancelada</option>
        </StyledSelect>}
        <button onClick={() => void carregarOpcoes(escolaId, turmaId)} disabled={carregando} className="p-2 text-sm font-medium disabled:opacity-50" style={field}>Atualizar opções</button>
        <button onClick={() => void gerar()} disabled={carregando || !escolaId} className="p-2 text-sm font-semibold disabled:opacity-50" style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary-solid)", color: "var(--status-text-on-color)" }}>
          {carregando ? "Gerando..." : "Gerar relatório"}
        </button>
      </section>

      {relatorio && (
        <section className="mt-6">
          <div className="cabecalho-relatorio mb-4 border-b-2 pb-3" style={{ borderColor: "var(--text-primary)" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-secondary)" }}>Relatório pedagógico</p>
                <h2 className="mt-1 text-xl font-bold">{String(relatorio.metadados.Escola ?? "Unidade escolar")}</h2>
                <h3 className="mt-0.5 text-lg font-semibold">{TIPOS[tipo]}</h3>
              </div>
              <div className="text-left text-xs sm:text-right" style={{ color: "var(--text-secondary)" }}>
                <p><strong>Ano letivo:</strong> {String(relatorio.metadados["Ano letivo"] ?? anoLetivo)}</p>
                <p><strong>Turma:</strong> {String(relatorio.metadados.Turma ?? "Todas")}</p>
                <p><strong>Matéria:</strong> {String(relatorio.metadados.Disciplina ?? "Todas")}</p>
                <p><strong>Emissão:</strong> {new Date(String(relatorio.metadados["Gerado em"])).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            </div>
            {tipo === "intervencao" && relatorio.intervencao && <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>Critério: {disciplinaId ? `alunos ativos com média acumulada abaixo de ${relatorio.intervencao.mediaLimite.toLocaleString("pt-BR")} na matéria selecionada` : `alunos ativos com ${relatorio.intervencao.minimoDisciplinas} ou mais disciplinas com média acumulada abaixo de ${relatorio.intervencao.mediaLimite.toLocaleString("pt-BR")}`}. Total identificado: {relatorio.intervencao.alunos.length}.</p>}
          </div>
          <div className="nao-imprimir mb-4 flex flex-wrap items-center justify-between gap-3">
            {tipo === "intervencao" ? <div className="flex rounded-lg p-1" style={field}>
              {(["completo", "compacto"] as const).map((modo) => <button key={modo} onClick={() => setModoIntervencao(modo)} className="rounded-md px-3 py-1.5 text-sm font-semibold capitalize" style={{ background: modoIntervencao === modo ? "var(--brand-primary-solid)" : "transparent", color: modoIntervencao === modo ? "white" : "var(--text-secondary)" }}>{modo}</button>)}
            </div> : <span />}
            <div className="flex gap-2">
              <a href={"/api/relatorios?" + parametros("csv").toString()} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold" style={{ borderRadius: "var(--radius-sm)", background: "var(--status-success-solid)", color: "white" }}>
                <Download className="h-4 w-4" />CSV
              </a>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold" style={{ borderRadius: "var(--radius-sm)", background: "var(--brand-primary-solid)", color: "white" }}>
                <Printer className="h-4 w-4" />Gerar PDF
              </button>
            </div>
          </div>

          {tipo === "intervencao" && relatorio.intervencao ? (
            <>
              {modoIntervencao === "completo" && <div className="resumo-intervencao mb-4 grid gap-2 sm:grid-cols-3">
                <div className="p-4" style={card}><p className="text-xs" style={{ color: "var(--text-secondary)" }}>Alunos que precisam de intervenção</p><p className="mt-1 text-3xl font-bold" style={{ color: "var(--status-danger-bg)" }}>{relatorio.intervencao.alunos.length}</p></div>
                <div className="p-4" style={card}><p className="text-xs" style={{ color: "var(--text-secondary)" }}>Critério por disciplina</p><p className="mt-1 text-xl font-bold">Média abaixo de {relatorio.intervencao.mediaLimite.toLocaleString("pt-BR")}</p></div>
                <div className="p-4" style={card}><p className="text-xs" style={{ color: "var(--text-secondary)" }}>{disciplinaId ? "Matéria analisada" : "Quantidade mínima"}</p><p className="mt-1 text-xl font-bold">{disciplinaId ? String(relatorio.metadados.Disciplina) : `${relatorio.intervencao.minimoDisciplinas} matérias críticas`}</p></div>
              </div>}
              <div className={modoIntervencao === "compacto" ? "space-y-2" : "space-y-3"}>
                {relatorio.intervencao.alunos.map((aluno, indice) => (
                  <article key={aluno.alunoId} className={`bloco-intervencao overflow-hidden ${modoIntervencao === "compacto" ? "modo-compacto" : "modo-completo"}`} style={{ ...card, borderColor: "var(--status-danger-bg)" }}>
                    <header className={`flex flex-wrap items-center justify-between ${modoIntervencao === "compacto" ? "gap-2 px-3 py-2" : "gap-3 p-3"}`} style={{ background: "var(--status-danger-tint)" }}>
                      <div>
                        {modoIntervencao === "completo" && <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--status-danger-bg)" }}>Aluno {indice + 1}</p>}
                        <h3 className={`${modoIntervencao === "compacto" ? "text-sm" : "mt-0.5 text-base"} font-bold`}>{aluno.aluno}</h3>
                        <p className={modoIntervencao === "compacto" ? "text-xs" : "text-sm"} style={{ color: "var(--text-secondary)" }}>{aluno.turma} · Nº {aluno.numeroChamada} · Média geral {aluno.mediaGeral.toLocaleString("pt-BR")}</p>
                      </div>
                      <span className={`rounded-full font-bold ${modoIntervencao === "compacto" ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm"}`} style={{ border: "1px solid var(--status-danger-bg)", color: "var(--status-danger-bg)" }}>{aluno.disciplinas.length} matérias críticas</span>
                    </header>
                    <div className="tabela-intervencao overflow-x-auto">
                      <table className={`report-table w-full ${modoIntervencao === "compacto" ? "text-[11px]" : "text-xs"}`}>
                        <thead style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}><tr><th className="px-3 py-1.5 text-left">Matéria</th><th className="px-2 py-1.5 text-center">1º bim.</th><th className="px-2 py-1.5 text-center">2º bim.</th><th className="px-2 py-1.5 text-center">3º bim.</th><th className="px-2 py-1.5 text-center">4º bim.</th><th className="px-3 py-1.5 text-center">Média</th></tr></thead>
                        <tbody>{aluno.disciplinas.map((disciplina) => <tr key={disciplina.disciplina} style={{ borderTop: "1px solid var(--border-subtle)" }}><td className={`px-3 font-semibold ${modoIntervencao === "compacto" ? "py-1" : "py-1.5"}`}>{disciplina.disciplina}</td>{[disciplina.b1, disciplina.b2, disciplina.b3, disciplina.b4].map((nota, bimestreAtual) => <td key={bimestreAtual} className={`px-2 text-center ${modoIntervencao === "compacto" ? "py-1" : "py-1.5"}`}>{nota === null ? "—" : nota.toLocaleString("pt-BR")}</td>)}<td className={`px-3 text-center font-bold ${modoIntervencao === "compacto" ? "py-1" : "py-1.5"}`} style={{ color: "var(--status-danger-bg)" }}>{disciplina.media.toLocaleString("pt-BR")}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </article>
                ))}
                {relatorio.intervencao.alunos.length === 0 && <div className="p-8 text-center text-sm" style={card}>{disciplinaId ? "Nenhum aluno possui média abaixo de 4,5 na matéria selecionada." : "Nenhum aluno possui 3 ou mais matérias com média abaixo de 4,5 nos filtros selecionados."}</div>}
              </div>
            </>
          ) : (<>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[["Registros", relatorio.resumo.registros], ["Média geral", relatorio.resumo.mediaGeral], ["Notas abaixo de 5", relatorio.resumo.abaixoMedia], ["Recuperações", relatorio.resumo.recuperacoes], ["Índice experimental", relatorio.indice?.indice ?? null]].map(([nome, valor]) =>
              <div key={String(nome)} className="p-3" style={card}><p className="text-xs" style={{ color: "var(--text-secondary)" }}>{nome}</p><p className="mt-1 text-xl font-semibold">{formatar(valor as string | number | null)}</p></div>
            )}
          </div>
          {relatorio.indice && <p className="mb-4 text-xs" style={{ color: "var(--text-secondary)" }}>
            Índice composto experimental: 50% média normalizada, 30% percentual de notas ≥ 5 e 20% evolução. Amostra: {relatorio.indice.totalNotas} notas e {relatorio.indice.paresComparaveis} pares comparáveis. Não define aprovação nem diagnóstico.
          </p>}

          <div className="overflow-x-auto" style={card}>
            <table className="w-full min-w-[760px] text-sm">
              <thead style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}><tr>{cabecalhos.map((item) => <th key={item} className="px-3 py-2 text-left">{item}</th>)}</tr></thead>
              <tbody>{relatorio.linhas.map((linha, indice) => <tr key={indice} style={{ borderTop: "1px solid var(--border-subtle)" }}>{cabecalhos.map((item) => <td key={item} className="px-3 py-2">{formatar(linha[item])}</td>)}</tr>)}</tbody>
            </table>
            {relatorio.linhas.length === 0 && <p className="p-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>Nenhum registro corresponde aos filtros.</p>}
          </div>
          </>)}
        </section>
      )}
    </main>
  );
}

export default function RelatoriosPage() {
  return <AuthGuard allow={ROLES}><RelatoriosConteudo /></AuthGuard>;
}
