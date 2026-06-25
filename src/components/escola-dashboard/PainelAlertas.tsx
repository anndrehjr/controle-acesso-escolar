"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"

export type DisciplinaAlerta = {
  disciplinaId: string
  nome: string
  codigo: string
  nota: number
}

export type AlunoAlerta = {
  id: string
  nome: string
  numeroChamada: number
  turmaId: string
  turmaNome: string
  mediaGeral: number | null
  status: "critico" | "atencao"
  totalDisciplinasRisco: number
  disciplinas: DisciplinaAlerta[]
}

type Props = {
  alunosAlerta: AlunoAlerta[]
  bimestre: number
  turmas: { id: string; nome: string }[]
}

type Filtro = "todos" | "critico" | "atencao"
type Ordenacao = "risco" | "media_asc" | "media_desc" | "nome"

function getBgBarra(nota: number) {
  if (nota < 5) return "bg-red-500"
  if (nota < 7) return "bg-amber-500"
  return "bg-emerald-500"
}

export default function PainelAlertas({ alunosAlerta, bimestre, turmas }: Props) {
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [busca, setBusca] = useState("")
  const [turmaFiltro, setTurmaFiltro] = useState("")
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("risco")
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoAlerta | null>(null)
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const totalCriticos = alunosAlerta.filter(a => a.status === "critico").length
  const totalAtencao = alunosAlerta.filter(a => a.status === "atencao").length

  const abrirDrawer = useCallback((aluno: AlunoAlerta) => {
    setAlunoSelecionado(aluno)
    setDrawerAberto(true)
  }, [])

  const fecharDrawer = useCallback(() => {
    setDrawerAberto(false)
    setTimeout(() => setAlunoSelecionado(null), 300)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") fecharDrawer() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [fecharDrawer])

  useEffect(() => {
    document.body.style.overflow = drawerAberto ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [drawerAberto])

  const alunosFiltrados = alunosAlerta
    .filter(a => {
      if (filtro === "critico" && a.status !== "critico") return false
      if (filtro === "atencao" && a.status !== "atencao") return false
      if (turmaFiltro && a.turmaId !== turmaFiltro) return false
      if (busca && !a.nome.toLowerCase().includes(busca.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (ordenacao === "risco") {
        if (a.status !== b.status) return a.status === "critico" ? -1 : 1
        if (b.totalDisciplinasRisco !== a.totalDisciplinasRisco)
          return b.totalDisciplinasRisco - a.totalDisciplinasRisco
        return (a.mediaGeral ?? 10) - (b.mediaGeral ?? 10)
      }
      if (ordenacao === "media_asc") return (a.mediaGeral ?? 10) - (b.mediaGeral ?? 10)
      if (ordenacao === "media_desc") return (b.mediaGeral ?? 0) - (a.mediaGeral ?? 0)
      return a.nome.localeCompare(b.nome)
    })

  return (
    <>
      <div className="space-y-6">
        {/* Panel header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-red-900/60 bg-red-950/40 px-3 py-1 text-xs font-medium text-red-400">
              Monitoramento Pedagógico
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              Painel de Alertas
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {bimestre}º bimestre · Alunos que necessitam de intervenção
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setFiltro(f => f === "critico" ? "todos" : "critico")}
            className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] ${
              filtro === "critico"
                ? "border-red-500/60 bg-red-950/60 shadow-lg shadow-red-900/20"
                : "border-red-900/40 bg-red-950/20 hover:border-red-700/50 hover:bg-red-950/35 hover:shadow-lg hover:shadow-red-900/10"
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.12),transparent_60%)]" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-red-500">Crítico</span>
              </div>
              <p className="text-5xl font-black text-red-300">{totalCriticos}</p>
              <p className="mt-1.5 text-xs text-zinc-400">alunos com média &lt; 5,0</p>
              <p className="mt-0.5 text-xs text-zinc-600">Clique para filtrar</p>
            </div>
            {filtro === "critico" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            )}
          </button>

          <button
            onClick={() => setFiltro(f => f === "atencao" ? "todos" : "atencao")}
            className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] ${
              filtro === "atencao"
                ? "border-amber-500/60 bg-amber-950/60 shadow-lg shadow-amber-900/20"
                : "border-amber-900/40 bg-amber-950/15 hover:border-amber-700/50 hover:bg-amber-950/25 hover:shadow-lg hover:shadow-amber-900/10"
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_60%)]" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Atenção</span>
              </div>
              <p className="text-5xl font-black text-amber-300">{totalAtencao}</p>
              <p className="mt-1.5 text-xs text-zinc-400">alunos com média 5,0 – 6,9</p>
              <p className="mt-0.5 text-xs text-zinc-600">Clique para filtrar</p>
            </div>
            {filtro === "atencao" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            )}
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar aluno por nome..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-9 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1 gap-0.5">
            {(["todos", "critico", "atencao"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  filtro === f
                    ? f === "critico"
                      ? "bg-red-900/70 text-red-300 shadow-sm"
                      : f === "atencao"
                      ? "bg-amber-900/60 text-amber-300 shadow-sm"
                      : "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {f === "todos" ? "Todos" : f === "critico" ? "Críticos" : "Atenção"}
              </button>
            ))}
          </div>

          {turmas.length > 0 && (
            <select
              value={turmaFiltro}
              onChange={e => setTurmaFiltro(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 px-3 text-sm text-white outline-none transition focus:border-zinc-600 cursor-pointer"
            >
              <option value="">Todas as turmas</option>
              {turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          )}

          <select
            value={ordenacao}
            onChange={e => setOrdenacao(e.target.value as Ordenacao)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 px-3 text-sm text-white outline-none transition focus:border-zinc-600 cursor-pointer"
          >
            <option value="risco">Maior risco primeiro</option>
            <option value="media_asc">Menor média primeiro</option>
            <option value="media_desc">Maior média primeiro</option>
            <option value="nome">Nome A–Z</option>
          </select>
        </div>

        {/* Count */}
        <p className="text-xs text-zinc-600">
          {alunosFiltrados.length === 0
            ? "Nenhum resultado"
            : `${alunosFiltrados.length} aluno${alunosFiltrados.length !== 1 ? "s" : ""} encontrado${alunosFiltrados.length !== 1 ? "s" : ""}`}
          {turmaFiltro && ` · ${turmas.find(t => t.id === turmaFiltro)?.nome ?? ""}`}
        </p>

        {/* Cards grid */}
        {alunosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-14 text-center">
            <p className="text-zinc-400">
              {busca || turmaFiltro
                ? "Nenhum aluno corresponde aos filtros aplicados."
                : "Nenhum aluno em situação de alerta neste bimestre. "}
            </p>
            {(busca || turmaFiltro) && (
              <button
                onClick={() => { setBusca(""); setTurmaFiltro(""); setFiltro("todos") }}
                className="mt-3 text-xs text-zinc-500 underline hover:text-zinc-300"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {alunosFiltrados.map((aluno, idx) => (
              <StudentCard
                key={aluno.id}
                aluno={aluno}
                rank={idx + 1}
                onClick={() => abrirDrawer(aluno)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer portal */}
      {mounted && createPortal(
        <div
          className={`fixed inset-0 z-[9999] transition-all duration-300 ${
            drawerAberto ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={fecharDrawer}
          />
          <div
            className={`absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${
              drawerAberto ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {alunoSelecionado && (
              <DrawerContent aluno={alunoSelecionado} onClose={fecharDrawer} />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function StudentCard({
  aluno,
  rank,
  onClick,
}: {
  aluno: AlunoAlerta
  rank: number
  onClick: () => void
}) {
  const isCritico = aluno.status === "critico"

  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-2xl border p-5 text-left transition-all duration-200 hover:scale-[1.015] hover:shadow-xl active:scale-[0.995] ${
        isCritico
          ? "border-red-900/40 bg-gradient-to-br from-red-950/20 to-zinc-950 hover:border-red-700/60 hover:from-red-950/30 hover:shadow-red-900/10"
          : "border-amber-900/30 bg-gradient-to-br from-amber-950/10 to-zinc-950 hover:border-amber-700/50 hover:from-amber-950/20 hover:shadow-amber-900/10"
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
            isCritico
              ? "border border-red-900/50 bg-red-950/70 text-red-400"
              : "border border-amber-900/40 bg-amber-950/60 text-amber-400"
          }`}>
            {rank}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{aluno.nome}</p>
            <p className="text-xs text-zinc-500">{aluno.turmaNome}</p>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
          isCritico
            ? "border-red-900/50 bg-red-950/50 text-red-400"
            : "border-amber-900/40 bg-amber-950/40 text-amber-400"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isCritico ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
          {isCritico ? "Crítico" : "Atenção"}
        </span>
      </div>

      {/* Média */}
      <div className={`mb-4 rounded-xl border px-4 py-3 ${
        isCritico ? "border-red-900/30 bg-red-950/25" : "border-amber-900/20 bg-amber-950/15"
      }`}>
        <p className="text-xs text-zinc-500">Média geral</p>
        <p className={`mt-0.5 text-3xl font-black ${isCritico ? "text-red-300" : "text-amber-300"}`}>
          {aluno.mediaGeral !== null
            ? aluno.mediaGeral.toFixed(1).replace(".", ",")
            : "—"}
        </p>
      </div>

      {/* Disciplinas em alerta */}
      {aluno.totalDisciplinasRisco > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs text-zinc-500">
            {aluno.totalDisciplinasRisco} disciplina{aluno.totalDisciplinasRisco !== 1 ? "s" : ""} em alerta
          </p>
          <div className="flex flex-wrap gap-1.5">
            {aluno.disciplinas.slice(0, 5).map(d => (
              <span
                key={d.disciplinaId}
                className="inline-flex items-center gap-1 rounded-full border border-red-900/50 bg-red-950/30 px-2.5 py-0.5 text-xs"
              >
                <span className="font-bold text-red-400">{d.codigo}</span>
                <span className="text-red-300">{d.nota.toFixed(1).replace(".", ",")}</span>
              </span>
            ))}
            {aluno.disciplinas.length > 5 && (
              <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-500">
                +{aluno.disciplinas.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className={`mt-1 flex items-center justify-end gap-1 text-xs font-medium transition-colors ${
        isCritico
          ? "text-red-600 group-hover:text-red-400"
          : "text-amber-600 group-hover:text-amber-400"
      }`}>
        Ver detalhes
        <svg
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

function DrawerContent({
  aluno,
  onClose,
}: {
  aluno: AlunoAlerta
  onClose: () => void
}) {
  const isCritico = aluno.status === "critico"

  return (
    <div className="p-6 pb-10">
      {/* Fechar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Fechar
        </button>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
          isCritico
            ? "border-red-900/50 bg-red-950/50 text-red-400"
            : "border-amber-900/40 bg-amber-950/40 text-amber-400"
        }`}>
          {isCritico ? "🔴 Crítico" : "🟡 Ponto de Atenção"}
        </span>
      </div>

      {/* Perfil do aluno */}
      <div className={`mb-6 rounded-2xl border p-5 ${
        isCritico
          ? "border-red-900/40 bg-gradient-to-br from-red-950/30 to-zinc-950"
          : "border-amber-900/40 bg-gradient-to-br from-amber-950/20 to-zinc-950"
      }`}>
        <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {aluno.turmaNome}
        </p>
        <h2 className="mb-4 text-xl font-black text-white">{aluno.nome}</h2>

        <div>
          <p className="text-xs text-zinc-500">Média geral</p>
          <div className="mt-1 flex items-end gap-2">
            <span className={`text-5xl font-black ${isCritico ? "text-red-300" : "text-amber-300"}`}>
              {aluno.mediaGeral !== null
                ? aluno.mediaGeral.toFixed(1).replace(".", ",")
                : "—"}
            </span>
            <span className="mb-1.5 text-sm text-zinc-600">/ 10,0</span>
          </div>
        </div>

        {/* Mini progress */}
        {aluno.mediaGeral !== null && (
          <div className="mt-3">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getBgBarra(aluno.mediaGeral)}`}
                style={{ width: `${(aluno.mediaGeral / 10) * 100}%` }}
              />
              <div className="absolute top-0 h-full w-px bg-zinc-500/60" style={{ left: "50%" }} />
            </div>
            <div className="mt-1 flex justify-between text-xs text-zinc-600">
              <span>0</span>
              <span>5,0 (mínimo)</span>
              <span>10</span>
            </div>
          </div>
        )}
      </div>

      {/* Disciplinas */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Disciplinas em Alerta
        </h3>

        {aluno.disciplinas.length > 0 ? (
          <div className="space-y-3">
            {aluno.disciplinas.map(d => (
              <DisciplinaBar key={d.disciplinaId} disciplina={d} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
            <p className="text-sm text-zinc-400">
              Nenhuma disciplina individualmente abaixo de 5,0.
            </p>
            <p className="mt-1.5 text-xs text-zinc-600">
              A baixa média resulta da combinação entre as disciplinas cursadas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function DisciplinaBar({
  disciplina,
}: {
  disciplina: DisciplinaAlerta
}) {
  const percentage = Math.min((disciplina.nota / 10) * 100, 100)
  const isBaixo = disciplina.nota < 5

  return (
    <div className={`rounded-xl border p-3.5 transition ${
      isBaixo
        ? "border-red-900/40 bg-red-950/15"
        : "border-zinc-800 bg-zinc-900/50"
    }`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-black text-zinc-300">
            {disciplina.codigo}
          </span>
          <span className="truncate text-sm font-medium text-zinc-200">{disciplina.nome}</span>
        </div>
        <span className={`shrink-0 text-xl font-black ${
          disciplina.nota < 5 ? "text-red-400" : disciplina.nota < 7 ? "text-amber-400" : "text-emerald-400"
        }`}>
          {disciplina.nota.toFixed(1).replace(".", ",")}
        </span>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${getBgBarra(disciplina.nota)}`}
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-zinc-500/60"
          style={{ left: "50%" }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-zinc-600">
        <span>0</span>
        <span>5,0</span>
        <span>10</span>
      </div>
    </div>
  )
}
