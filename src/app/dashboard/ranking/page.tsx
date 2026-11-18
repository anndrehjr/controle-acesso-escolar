"use client";

import { useEffect, useState } from "react";
import { Award, Crown, Medal, School, Sparkles, Trophy, Users } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import StyledSelect from "../../../components/StyledSelect";
import { useUsuarioAtual } from "../../../hooks/useUsuarioAtual";

type RankingItem = { alunoId: string; aluno: string; turmaId: string; turma: string; numeroChamada: number; media: number; totalNotas: number; totalDisciplinas: number; posicao: number };
type Dados = { escolas: Array<{ id: string; nome: string }>; escolaId: string; escolaNome: string; anoLetivo: number; turmas: Array<{ id: string; nome: string }>; turmaId: string | null; periodo: string; ultimoBimestreComDados: number; totalAlunos: number; mediaEscola: number | null; ranking: RankingItem[] };

const card: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" };
const medalhas = ["#f6c945", "#aeb9c8", "#d58b52"];

function notaCor(media: number) {
  if (media >= 8) return "var(--status-info-bg)";
  if (media >= 7) return "var(--status-success-bg)";
  if (media >= 5) return "var(--status-warning-bg)";
  return "var(--status-danger-bg)";
}

function Conteudo() {
  const { isDevMaster, loading: carregandoUsuario } = useUsuarioAtual();
  const [dados, setDados] = useState<Dados | null>(null);
  const [escolaId, setEscolaId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [periodo, setPeriodo] = useState("acumulado");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (carregandoUsuario || !isDevMaster) return;
    let cancelado = false;
    async function carregar() {
      setCarregando(true); setErro("");
      const params = new URLSearchParams({ periodo });
      if (escolaId) params.set("escolaId", escolaId);
      if (turmaId) params.set("turmaId", turmaId);
      try {
        const response = await fetch(`/api/ranking-alunos?${params}`, { cache: "no-store" });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "Não foi possível carregar o ranking");
        if (!cancelado) {
          setDados(json.data);
          if (!escolaId) setEscolaId(json.data.escolaId);
        }
      } catch (e) { if (!cancelado) setErro(e instanceof Error ? e.message : "Erro inesperado"); }
      finally { if (!cancelado) setCarregando(false); }
    }
    void carregar();
    return () => { cancelado = true; };
  }, [carregandoUsuario, isDevMaster, escolaId, turmaId, periodo]);

  if (!carregandoUsuario && !isDevMaster) return <main className="min-h-screen p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}><div className="mx-auto max-w-xl rounded-2xl p-8 text-center" style={card}><Crown className="mx-auto mb-3 h-10 w-10" style={{ color: "#f6c945" }} /><h1 className="text-xl font-bold">Área exclusiva do Dev Master</h1></div></main>;

  const top3 = dados?.ranking.slice(0, 3) ?? [];
  const tituloPeriodo = periodo === "acumulado" ? `Acumulado até o ${dados?.ultimoBimestreComDados ?? "—"}º bimestre` : `${periodo}º bimestre`;

  return <main className="min-h-screen p-4 md:p-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
    <div className="mx-auto max-w-[1500px]">
      <header className="overflow-hidden rounded-3xl border p-6 md:p-8" style={{ ...card, background: "radial-gradient(circle at 88% 10%,rgba(246,201,69,.22),transparent 32%),radial-gradient(circle at 8% 0%,rgba(59,130,246,.18),transparent 38%),var(--bg-card)" }}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider" style={{ background: "rgba(246,201,69,.14)", color: "#eabf35" }}><Crown className="h-4 w-4" /> Exclusivo Dev Master</span><h1 className="mt-4 text-3xl font-black md:text-4xl">Ranking dos alunos</h1><p className="mt-2 max-w-2xl" style={{ color: "var(--text-secondary)" }}>Compare os melhores desempenhos da escola inteira ou de cada turma, por bimestre e no acumulado do ano.</p></div>
          <Crown className="h-16 w-16" strokeWidth={1.4} style={{ color: "#f6c945", filter: "drop-shadow(0 8px 18px rgba(246,201,69,.28))" }} />
        </div>
      </header>

      <section className="mt-5 grid gap-3 rounded-2xl border p-4 md:grid-cols-3" style={card}>
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Escola<StyledSelect value={escolaId} onChange={(e) => { setEscolaId(e.target.value); setTurmaId(""); }} className="mt-2 w-full p-3 text-sm">{dados?.escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</StyledSelect></label>
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Turma<StyledSelect value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="mt-2 w-full p-3 text-sm"><option value="">Todas as turmas</option>{dados?.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</StyledSelect></label>
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Período<StyledSelect value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="mt-2 w-full p-3 text-sm">{[1,2,3,4].filter((b) => b <= (dados?.ultimoBimestreComDados ?? 4)).map((b) => <option key={b} value={b}>{b}º bimestre</option>)}<option value="acumulado">Ranking atual · acumulado</option></StyledSelect></label>
      </section>

      {erro && <div className="mt-5 rounded-2xl border p-4" style={{ ...card, borderColor: "var(--status-danger-bg)", color: "var(--status-danger-bg)" }}>{erro}</div>}
      {carregando && <div className="mt-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>Calculando o ranking...</div>}

      {!carregando && dados && <>
        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl p-4" style={card}><School className="h-5 w-5" style={{ color: "var(--brand-primary)" }} /><p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>Recorte</p><p className="mt-1 font-bold">{turmaId ? dados.turmas.find((t) => t.id === turmaId)?.nome : "Toda a escola"}</p></div>
          <div className="rounded-2xl p-4" style={card}><Users className="h-5 w-5" style={{ color: "var(--status-success-bg)" }} /><p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>Alunos classificados</p><p className="mt-1 text-2xl font-black">{dados.totalAlunos}</p></div>
          <div className="rounded-2xl p-4" style={card}><Sparkles className="h-5 w-5" style={{ color: "#f6c945" }} /><p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>Média do recorte</p><p className="mt-1 text-2xl font-black">{dados.mediaEscola?.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) ?? "—"}</p></div>
        </section>

        {top3.length > 0 && <section className="mt-5 rounded-3xl border p-5 md:p-7" style={card}><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#eabf35" }}>Pódio</p><h2 className="mt-1 text-xl font-black">Destaques · {tituloPeriodo}</h2></div><Trophy className="h-8 w-8" style={{ color: "#f6c945" }} /></div><div className="grid gap-3 md:grid-cols-3">{top3.map((item, i) => <article key={item.alunoId} className="relative overflow-hidden rounded-2xl border p-5" style={{ borderColor: `${medalhas[i]}88`, background: `linear-gradient(145deg,${medalhas[i]}18,transparent 55%)` }}><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-black" style={{ background: `${medalhas[i]}25`, color: medalhas[i] }}>{item.posicao}º</span><Medal className="h-7 w-7" style={{ color: medalhas[i] }} /></div><h3 className="mt-4 font-black uppercase">{item.aluno}</h3><p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{item.turma} · Nº {item.numeroChamada}</p><p className="mt-4 text-4xl font-black" style={{ color: notaCor(item.media) }}>{item.media.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</p><p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{item.totalNotas} notas consideradas</p></article>)}</div></section>}

        <section className="mt-5 overflow-hidden rounded-3xl border" style={card}><header className="flex flex-wrap items-center justify-between gap-3 border-b p-5" style={{ borderColor: "var(--border-subtle)" }}><div><h2 className="text-xl font-black">Classificação completa</h2><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{dados.escolaNome} · {tituloPeriodo} · {dados.anoLetivo}</p></div><Award className="h-7 w-7" style={{ color: "var(--brand-primary)" }} /></header><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead style={{ background: "var(--bg-app)", color: "var(--text-secondary)" }}><tr><th className="px-5 py-3 text-left">Posição</th><th className="px-4 py-3 text-left">Aluno</th><th className="px-4 py-3 text-left">Turma</th><th className="px-4 py-3 text-center">Chamada</th><th className="px-4 py-3 text-center">Disciplinas</th><th className="px-5 py-3 text-right">Média</th></tr></thead><tbody>{dados.ranking.map((item) => <tr key={item.alunoId} className="border-t transition hover:bg-white/[.025]" style={{ borderColor: "var(--border-subtle)" }}><td className="px-5 py-3 font-black" style={{ color: item.posicao <= 3 ? medalhas[item.posicao - 1] : "var(--text-secondary)" }}>{item.posicao}º</td><td className="px-4 py-3 font-bold">{item.aluno}</td><td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{item.turma}</td><td className="px-4 py-3 text-center">{item.numeroChamada}</td><td className="px-4 py-3 text-center">{item.totalDisciplinas}</td><td className="px-5 py-3 text-right text-lg font-black" style={{ color: notaCor(item.media) }}>{item.media.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td></tr>)}</tbody></table>{dados.ranking.length === 0 && <p className="p-10 text-center" style={{ color: "var(--text-secondary)" }}>Nenhuma nota encontrada nesse período.</p>}</div></section>
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs leading-5" style={{ color: "var(--text-secondary)" }}>O ranking considera somente alunos ativos e notas válidas de 0 a 10. No acumulado, entram todas as notas do 1º bimestre até o último bimestre com dados.</p>
      </>}
    </div>
  </main>;
}

export default function RankingPage() { return <AuthGuard allow={["DEV_MASTER"]}><Conteudo /></AuthGuard>; }
