"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import StyledSelect from "../StyledSelect"

export type DisciplinaAlerta = {
  disciplinaId: string
  nome: string
  codigo: string
  nota: number
  emConselho?: boolean
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

function getBarColor(nota: number): string {
  if (nota < 5) return "var(--status-danger-bg)"
  if (nota < 7) return "var(--status-warning-bg)"
  return "var(--status-success-bg)"
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: "var(--font-size-base)",
  outline: "none",
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
            <div
              className="mb-2 inline-flex px-3 py-1 text-xs font-medium"
              style={{
                background: "var(--status-danger-tint)",
                borderRadius: "var(--radius-pill)",
                color: "var(--status-danger-bg)",
              }}
            >
              Monitoramento Pedagógico
            </div>
            <h2
              className="text-xl tracking-tight"
              style={{ color: "var(--text-primary)", fontWeight: 600 }}
            >
              Painel de Alertas
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Risco anual · 3+ disciplinas pré-reprovadas (Pré-Reprovado) · 1–2 disciplinas pré-reprovadas (Atenção)
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setFiltro(f => f === "critico" ? "todos" : "critico")}
            className="p-5 text-left transition-all"
            style={{
              border: `2px solid ${filtro === "critico" ? "var(--status-danger-bg)" : "var(--border-subtle)"}`,
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: "var(--status-danger-bg)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--status-danger-bg)" }}
              >
                Pré-Reprovado
              </span>
            </div>
            <p
              className="text-4xl"
              style={{ color: "var(--text-primary)", fontWeight: 600 }}
            >
              {totalCriticos}
            </p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              3 ou mais disciplinas pré-reprovadas no ano
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)", opacity: 0.6 }}>
              Clique para filtrar
            </p>
          </button>

          <button
            onClick={() => setFiltro(f => f === "atencao" ? "todos" : "atencao")}
            className="p-5 text-left transition-all"
            style={{
              border: `2px solid ${filtro === "atencao" ? "#E8860C" : "var(--border-subtle)"}`,
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: "#E8860C" }} />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#E8860C" }}
              >
                Atenção
              </span>
            </div>
            <p
              className="text-4xl"
              style={{ color: "var(--text-primary)", fontWeight: 600 }}
            >
              {totalAtencao}
            </p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              1 ou 2 disciplinas pré-reprovadas no ano
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)", opacity: 0.6 }}>
              Clique para filtrar
            </p>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 min-w-[180px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "var(--text-secondary)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar aluno por nome..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full py-2.5 pl-9 pr-9 text-sm transition"
              style={inputStyle}
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition"
                style={{ color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            )}
          </div>

          <div
            className="flex p-1 gap-0.5"
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-card)",
            }}
          >
            {(["todos", "critico", "atencao"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className="px-3.5 py-1.5 text-xs font-medium transition-all"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background:
                    filtro === f
                      ? f === "critico"
                        ? "var(--status-danger-bg)"
                        : f === "atencao"
                        ? "#E8860C"
                        : "var(--brand-primary)"
                      : "transparent",
                  color: filtro === f ? "#FFFFFF" : "var(--text-secondary)",
                }}
              >
                {f === "todos" ? "Todos" : f === "critico" ? "Pré-Reprovados" : "Atenção"}
              </button>
            ))}
          </div>

          {turmas.length > 0 && (
            <StyledSelect
              value={turmaFiltro}
              onChange={e => setTurmaFiltro(e.target.value)}
              className="py-2.5 pl-3 text-sm"
              style={inputStyle}
            >
              <option value="">Todas as turmas</option>
              {turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </StyledSelect>
          )}

          <StyledSelect
            value={ordenacao}
            onChange={e => setOrdenacao(e.target.value as Ordenacao)}
            className="py-2.5 pl-3 text-sm"
            style={inputStyle}
          >
            <option value="risco">Maior risco primeiro</option>
            <option value="media_asc">Menor média primeiro</option>
            <option value="media_desc">Maior média primeiro</option>
            <option value="nome">Nome A–Z</option>
          </StyledSelect>
        </div>

        {/* Count */}
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {alunosFiltrados.length === 0
            ? "Nenhum resultado"
            : `${alunosFiltrados.length} aluno${alunosFiltrados.length !== 1 ? "s" : ""} encontrado${alunosFiltrados.length !== 1 ? "s" : ""}`}
          {turmaFiltro && ` · ${turmas.find(t => t.id === turmaFiltro)?.nome ?? ""}`}
        </p>

        {/* Cards grid */}
        {alunosFiltrados.length === 0 ? (
          <div
            className="p-14 text-center"
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-card)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {busca || turmaFiltro
                ? "Nenhum aluno corresponde aos filtros aplicados."
                : "Nenhum aluno em risco acadêmico no ano até agora."}
            </p>
            {(busca || turmaFiltro) && (
              <button
                onClick={() => { setBusca(""); setTurmaFiltro(""); setFiltro("todos") }}
                className="mt-3 text-xs underline"
                style={{ color: "var(--text-link)" }}
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
            className="absolute inset-0"
            style={{ background: "rgba(43,47,54,0.4)" }}
            onClick={fecharDrawer}
          />
          <div
            className={`absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${
              drawerAberto ? "translate-x-0" : "translate-x-full"
            }`}
            style={{
              background: "var(--bg-card)",
              borderLeft: "1px solid var(--border-subtle)",
            }}
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
  const statusColor = isCritico ? "var(--status-danger-bg)" : "#E8860C"
  const statusBg = isCritico ? "var(--status-danger-tint)" : "var(--status-warning-tint)"

  return (
    <button
      onClick={onClick}
      className="w-full p-5 text-left transition-all"
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center text-xs font-semibold"
            style={{
              background: statusBg,
              color: statusColor,
              borderRadius: "var(--radius-sm)",
            }}
          >
            {rank}
          </span>
          <div className="min-w-0">
            <p
              className="truncate text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {aluno.nome}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {aluno.turmaNome}
            </p>
          </div>
        </div>
        <span
          className="shrink-0 inline-flex items-center px-2.5 py-1 text-xs font-semibold"
          style={{
            borderRadius: "var(--radius-pill)",
            background: statusColor,
            color: "#FFFFFF",
          }}
        >
          {isCritico ? "Pré-Reprovado" : "Atenção"}
        </span>
      </div>

      {/* Disciplinas em risco — é essa contagem que define Pré-Reprovado/Atenção, não a média geral */}
      <div
        className="mb-4 px-4 py-3"
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-app)",
        }}
      >
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Disciplinas em risco
        </p>
        <p className="mt-0.5 text-2xl" style={{ color: statusColor, fontWeight: 600 }}>
          {aluno.totalDisciplinasRisco}
        </p>
      </div>

      {/* Disciplinas em alerta */}
      {aluno.totalDisciplinasRisco > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {aluno.disciplinas.slice(0, 5).map(d => (
              <span
                key={d.disciplinaId}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs"
                style={{
                  borderRadius: "var(--radius-pill)",
                  background: "var(--status-danger-tint)",
                  color: "var(--status-danger-bg)",
                  border: "1px solid rgba(224,82,74,0.2)",
                }}
              >
                <span className="font-semibold">{d.codigo}</span>
                <span>{d.nota.toFixed(1).replace(".", ",")}</span>
                {d.emConselho && <span className="font-semibold">· Conselho</span>}
              </span>
            ))}
            {aluno.disciplinas.length > 5 && (
              <span
                className="inline-flex items-center px-2 py-0.5 text-xs"
                style={{
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                +{aluno.disciplinas.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div
        className="mt-1 flex items-center justify-end gap-1 text-xs font-medium"
        style={{ color: "var(--text-link)" }}
      >
        Ver detalhes
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const statusColor = isCritico ? "var(--status-danger-bg)" : "#E8860C"

  return (
    <div className="p-6 pb-10">
      {/* Fechar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-sm transition"
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            background: "var(--bg-card)",
          }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Fechar
        </button>
        <span
          className="px-3 py-1 text-xs font-semibold"
          style={{
            borderRadius: "var(--radius-pill)",
            background: statusColor,
            color: "#FFFFFF",
          }}
        >
          {isCritico ? "Pré-Reprovado" : "Ponto de Atenção"}
        </span>
      </div>

      {/* Perfil do aluno */}
      <div
        className="mb-6 p-5"
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-app)",
        }}
      >
        <p
          className="mb-0.5 text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--text-secondary)" }}
        >
          {aluno.turmaNome}
        </p>
        <h2
          className="mb-4 text-lg"
          style={{ color: "var(--text-primary)", fontWeight: 600 }}
        >
          {aluno.nome}
        </h2>

        <div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Disciplinas em risco
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl" style={{ color: statusColor, fontWeight: 600 }}>
              {aluno.totalDisciplinasRisco}
            </span>
            <span className="mb-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              {aluno.totalDisciplinasRisco === 1 ? "disciplina pré-reprovada" : "disciplinas pré-reprovadas"}
            </span>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)", opacity: 0.7 }}>
            É essa contagem — não a média geral — que define o status do aluno: 3+ é Pré-Reprovado, 1–2 é Atenção.
          </p>
        </div>
      </div>

      {/* Disciplinas */}
      <div>
        <h3
          className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-secondary)" }}
        >
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
          <div
            className="p-5 text-center"
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-card)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Nenhuma disciplina pré-reprovada individualmente.
            </p>
            <p
              className="mt-1.5 text-xs"
              style={{ color: "var(--text-secondary)", opacity: 0.6 }}
            >
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
    <div
      className="p-3.5 transition"
      style={{
        border: `1px solid ${isBaixo ? "rgba(224,82,74,0.3)" : "var(--border-subtle)"}`,
        borderRadius: "var(--radius-sm)",
        background: isBaixo ? "var(--status-danger-tint)" : "var(--bg-card)",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="shrink-0 px-2 py-0.5 text-xs font-semibold"
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              background: "var(--bg-app)",
            }}
          >
            {disciplina.codigo}
          </span>
          <span
            className="truncate text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {disciplina.nome}
          </span>
          {disciplina.emConselho && (
            <span
              className="shrink-0 px-2 py-0.5 text-xs font-semibold"
              style={{
                borderRadius: "var(--radius-pill)",
                background: "var(--status-warning-tint)",
                color: "#7A5800",
              }}
            >
              Conselho
            </span>
          )}
        </div>
        <span
          className="shrink-0 text-lg font-semibold"
          style={{
            color:
              disciplina.nota < 5
                ? "var(--status-danger-bg)"
                : disciplina.nota < 7
                ? "#E8860C"
                : "var(--status-success-bg)",
          }}
        >
          {disciplina.nota.toFixed(1).replace(".", ",")}
        </span>
      </div>

      <div
        className="relative h-2 overflow-hidden"
        style={{ background: "var(--border-subtle)", borderRadius: "var(--radius-pill)" }}
      >
        <div
          className="h-full"
          style={{
            width: `${percentage}%`,
            background: getBarColor(disciplina.nota),
            borderRadius: "var(--radius-pill)",
          }}
        />
        <div
          className="absolute top-0 h-full w-px"
          style={{ background: "var(--text-secondary)", opacity: 0.3, left: "50%" }}
        />
      </div>
      <div
        className="mt-1 flex justify-between text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        <span>0</span>
        <span>5,0</span>
        <span>10</span>
      </div>
    </div>
  )
}
