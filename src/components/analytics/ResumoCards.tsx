"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Users, AlertTriangle, BookOpen, Award, Target, ChevronRight } from "lucide-react";
import InfoTooltip from "../InfoTooltip";
import Modal from "../Modal";
import MediaGeralModal from "./MediaGeralModal";
import ZonaAtencaoModal from "./ZonaAtencaoModal";
import PreReprovadosModal from "./PreReprovadosModal";
import TotalAlunosModal from "./TotalAlunosModal";
import RankingDisciplinasModal from "./RankingDisciplinasModal";
import RankingTurmasModal from "./RankingTurmasModal";
import EvolucaoTurmasModal from "./EvolucaoTurmasModal";
import type { ExecutivoResult } from "../../lib/analytics/buildExecutivo";

type Props = {
  executivo: ExecutivoResult;
  totalAlunos: number;
};

type ModalAberto =
  | "media"
  | "totalAlunos"
  | "preReprovados"
  | "atencao"
  | "melhorDisciplina"
  | "piorDisciplina"
  | "melhorTurma"
  | "evolucaoTurmas"
  | null;

function corMedia(m: number) {
  if (m < 5) return "#ef4444";
  if (m < 7) return "#eab308";
  if (m < 9) return "#22c55e";
  return "#3b82f6";
}

function nivel(m: number) {
  if (m < 5) return "Abaixo do Básico";
  if (m < 7) return "Básico";
  if (m < 9) return "Adequado";
  return "Avançado";
}

const base: React.CSSProperties = {
  background: "var(--bg-card)",
  borderColor: "var(--border-subtle)",
  boxShadow: "var(--shadow-card)",
};

const sep: React.CSSProperties = {
  borderTop: "1px solid var(--border-subtle)",
};

function CardClicavel({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (!onClick) {
    return <div className="relative rounded-2xl border p-5" style={base}>{children}</div>;
  }
  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-2xl border p-5 text-left transition"
      style={base}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand-primary)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
    >
      {children}
      <ChevronRight
        className="absolute right-3 top-3 h-4 w-4 opacity-0 transition group-hover:opacity-60"
        style={{ color: "var(--text-secondary)" }}
      />
    </button>
  );
}

export default function ResumoCards({ executivo, totalAlunos }: Props) {
  const [modalAberto, setModalAberto] = useState<ModalAberto>(null);

  const { snapshotAtual, snapshotAnterior } = executivo;
  const mediaGeral = snapshotAtual.media ?? 0;
  const deltaMedia =
    snapshotAtual.media !== null && snapshotAnterior?.media != null
      ? Number((snapshotAtual.media - snapshotAnterior.media).toFixed(1))
      : null;
  const deltaLabel = deltaMedia !== null ? (deltaMedia >= 0 ? "+" + deltaMedia.toFixed(1) : deltaMedia.toFixed(1)) + " vs bim anterior" : `${snapshotAtual.bimestre}º bimestre`;
  const deltaCor = deltaMedia !== null && deltaMedia < 0 ? "#ef4444" : "#22c55e";

  const disciplinasTodas = [...executivo.rankingDisciplinasFundamental, ...executivo.rankingDisciplinasMedio];
  const melhorDisciplina = [...disciplinasTodas].sort((a, b) => (b.media ?? 0) - (a.media ?? 0))[0];
  const piorDisciplina = [...disciplinasTodas].sort((a, b) => (a.media ?? 10) - (b.media ?? 10))[0];
  const melhorTurma = [...executivo.rankingTurmas].sort((a, b) => (b.media ?? 0) - (a.media ?? 0))[0];
  const turmaMaisEvoluiu = [...executivo.rankingTurmas]
    .filter((t) => t.evolucao !== null)
    .sort((a, b) => (b.evolucao as number) - (a.evolucao as number))[0];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardClicavel onClick={() => setModalAberto("media")}>
          <div className="flex items-center justify-between mb-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
              Média Geral
              <InfoTooltip align="start" texto="Média aritmética de todas as notas lançadas no bimestre selecionado. Clique para ver a evolução completa do ano." />
            </p>
            <Target className="h-5 w-5" style={{ color: corMedia(mediaGeral) }} />
          </div>
          <p className="text-4xl font-black" style={{ color: corMedia(mediaGeral) }}>{mediaGeral.toFixed(1)}</p>
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{nivel(mediaGeral)} · {snapshotAtual.label}</p>
          <p className="mt-3 text-xs font-semibold pt-3" style={{ color: deltaCor, ...sep }}>{deltaLabel}</p>
        </CardClicavel>

        <CardClicavel onClick={() => setModalAberto("totalAlunos")}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Total de Alunos</p>
            <Users className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
          </div>
          <p className="text-4xl font-black" style={{ color: "var(--text-primary)" }}>{totalAlunos}</p>
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>alunos ativos</p>
          <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>Ver matrícula: ativos x transferidos</p>
        </CardClicavel>

        <CardClicavel onClick={() => setModalAberto("preReprovados")}>
          <div className="flex items-center justify-between mb-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
              Alunos Pré-Reprovados
              <InfoTooltip align="start" texto="Alunos com 3 ou mais disciplinas em risco (média abaixo de 5). Separado por nível de ensino, com o total geral da escola. Clique para ver a evolução." />
            </p>
            <AlertTriangle className="h-5 w-5" style={{ color: executivo.alunosCriticosGeral > 0 ? "#ef4444" : "#22c55e" }} />
          </div>
          <p className="text-4xl font-black" style={{ color: executivo.alunosCriticosGeral > 0 ? "#ef4444" : "#22c55e" }}>{executivo.alunosCriticosGeral}</p>
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Total geral · 3+ disciplinas em risco</p>
          <div className="mt-3 flex items-center justify-between pt-3 text-xs" style={sep}>
            <span style={{ color: "var(--text-secondary)" }}>Fundamental: <strong style={{ color: "var(--text-primary)" }}>{executivo.alunosCriticosFundamental}</strong></span>
            <span style={{ color: "var(--text-secondary)" }}>Médio: <strong style={{ color: "var(--text-primary)" }}>{executivo.alunosCriticosMedio}</strong></span>
          </div>
        </CardClicavel>

        <CardClicavel onClick={() => setModalAberto("atencao")}>
          <div className="flex items-center justify-between mb-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
              Zona de Atenção
              <InfoTooltip align="start" texto="Alunos com 1 ou 2 disciplinas em risco. Clique para ver a evolução histórica e quem entrou/saiu desde o bimestre anterior." />
            </p>
            <TrendingDown className="h-5 w-5" style={{ color: "#eab308" }} />
          </div>
          <p className="text-4xl font-black" style={{ color: "#eab308" }}>{executivo.alunosAtencaoGeral}</p>
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>1-2 disciplinas em risco</p>
          <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>
            {executivo.alunosAtencaoGeral === 0 ? "sem alunos sinalizados" : `${((executivo.alunosAtencaoGeral / Math.max(totalAlunos, 1)) * 100).toFixed(0)}% da escola`}
          </p>
        </CardClicavel>

        <CardClicavel onClick={() => setModalAberto("melhorDisciplina")}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Melhor Disciplina</p>
            <Award className="h-5 w-5" style={{ color: "#22c55e" }} />
          </div>
          <p className="text-lg font-black leading-tight" style={{ color: "#22c55e" }}>{melhorDisciplina?.nome ?? "—"}</p>
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>média {melhorDisciplina?.media?.toFixed(1) ?? "—"}</p>
          <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>Ver top 5 por nível de ensino</p>
        </CardClicavel>

        <CardClicavel onClick={() => setModalAberto("piorDisciplina")}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Disciplina Crítica</p>
            <BookOpen className="h-5 w-5" style={{ color: "#ef4444" }} />
          </div>
          <p className="text-lg font-black leading-tight" style={{ color: "#ef4444" }}>{piorDisciplina?.nome ?? "—"}</p>
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>média {piorDisciplina?.media?.toFixed(1) ?? "—"}</p>
          <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>Ver as 5 mais críticas por nível</p>
        </CardClicavel>

        <CardClicavel onClick={() => setModalAberto("melhorTurma")}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Melhor Turma</p>
            <Award className="h-5 w-5" style={{ color: "#22c55e" }} />
          </div>
          <p className="text-xl font-black leading-tight" style={{ color: "#22c55e" }}>{melhorTurma?.nome ?? "—"}</p>
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>média {melhorTurma?.media?.toFixed(1) ?? "—"}</p>
          <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>Ver ranking completo de turmas</p>
        </CardClicavel>

        <CardClicavel onClick={() => setModalAberto("evolucaoTurmas")}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Turma Mais Evoluiu</p>
            <TrendingUp className="h-5 w-5" style={{ color: "#3b82f6" }} />
          </div>
          <p className="text-xl font-black leading-tight" style={{ color: "#3b82f6" }}>{turmaMaisEvoluiu?.nome ?? "—"}</p>
          {turmaMaisEvoluiu?.evolucao != null && (
            <p className="mt-1 text-xs font-medium" style={{ color: "#3b82f6" }}>
              {turmaMaisEvoluiu.evolucao >= 0 ? "+" : ""}{turmaMaisEvoluiu.evolucao.toFixed(1)} pontos no ano
            </p>
          )}
          <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>Ver quem mais evoluiu e quem mais caiu</p>
        </CardClicavel>
      </div>

      <Modal
        aberto={modalAberto === "media"}
        onFechar={() => setModalAberto(null)}
        titulo="Média Geral"
        subtitulo="Evolução da média da escola ao longo do ano"
      >
        <MediaGeralModal executivo={executivo} />
      </Modal>

      <Modal
        aberto={modalAberto === "totalAlunos"}
        onFechar={() => setModalAberto(null)}
        titulo="Total de Alunos"
        subtitulo="Situação atual da matrícula"
      >
        <TotalAlunosModal executivo={executivo} />
      </Modal>

      <Modal
        aberto={modalAberto === "preReprovados"}
        onFechar={() => setModalAberto(null)}
        titulo="Alunos Pré-Reprovados"
        subtitulo="Evolução ao longo do ano, por nível de ensino"
      >
        <PreReprovadosModal executivo={executivo} />
      </Modal>

      <Modal
        aberto={modalAberto === "atencao"}
        onFechar={() => setModalAberto(null)}
        titulo="Zona de Atenção"
        subtitulo="Alunos com 1-2 disciplinas em risco — evolução ao longo do ano"
      >
        <ZonaAtencaoModal executivo={executivo} />
      </Modal>

      <Modal
        aberto={modalAberto === "melhorDisciplina"}
        onFechar={() => setModalAberto(null)}
        titulo="Top 5 Disciplinas — Melhor Desempenho"
        subtitulo="Separado por nível de ensino"
      >
        <RankingDisciplinasModal
          fundamental={executivo.rankingDisciplinasFundamental}
          medio={executivo.rankingDisciplinasMedio}
          foco="melhor"
        />
      </Modal>

      <Modal
        aberto={modalAberto === "piorDisciplina"}
        onFechar={() => setModalAberto(null)}
        titulo="Top 5 Disciplinas — Mais Críticas"
        subtitulo="Separado por nível de ensino"
      >
        <RankingDisciplinasModal
          fundamental={executivo.rankingDisciplinasFundamental}
          medio={executivo.rankingDisciplinasMedio}
          foco="critica"
        />
      </Modal>

      <Modal
        aberto={modalAberto === "melhorTurma"}
        onFechar={() => setModalAberto(null)}
        titulo="Ranking de Turmas"
        subtitulo="Todas as turmas da escola, ordenadas por média"
      >
        <RankingTurmasModal rankingTurmas={executivo.rankingTurmas} />
      </Modal>

      <Modal
        aberto={modalAberto === "evolucaoTurmas"}
        onFechar={() => setModalAberto(null)}
        titulo="Evolução das Turmas"
        subtitulo="Quem mais evoluiu e quem mais caiu ao longo do ano"
      >
        <EvolucaoTurmasModal rankingTurmas={executivo.rankingTurmas} />
      </Modal>
    </>
  );
}
