"use client";

import { useState } from "react";
import {
  Users,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Target,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import InfoTooltip from "../InfoTooltip";

type AlunoDestaque = {
  id: string;
  nome: string;
  numeroChamada: number;
  media: number | null;
};

type Props = {
  totalAlunos: number;
  totalTurmas: number;
  mediaGeral: number;
  alunosCriticos: number;
  alunosAbaixoBasico: number;
  percentualAdequado: number;
  totalAdequadosOuAvancados: number;
  melhorTurma: string;
  melhorTurmaMedia: number;
  turmaAlerta: string;
  turmaAlertaMedia: number;
  disciplinaCritica: string;
  disciplinaCriticaPercentual: number;
  alunosAtencao: number;
  turmaFiltrada?: boolean;
  melhorAluno?: AlunoDestaque | null;
  pioresAlunos?: AlunoDestaque[];
};

function rotulo(aluno: AlunoDestaque, mostrarNomes: boolean) {
  if (mostrarNomes) return aluno.nome;
  return `Nº ${String(aluno.numeroChamada).padStart(2, "0")}`;
}

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "var(--shadow-card)",
  padding: "var(--space-4)",
};

export default function KPICardsReal({
  totalAlunos,
  totalTurmas,
  mediaGeral,
  alunosCriticos,
  alunosAbaixoBasico,
  percentualAdequado,
  totalAdequadosOuAvancados,
  melhorTurma,
  melhorTurmaMedia,
  turmaAlerta,
  turmaAlertaMedia,
  disciplinaCritica,
  disciplinaCriticaPercentual,
  alunosAtencao,
  turmaFiltrada = false,
  melhorAluno,
  pioresAlunos = [],
}: Props) {
  const [mostrarNomes, setMostrarNomes] = useState(true);

  const cardsBase = [
    {
      titulo: "Total de Alunos",
      valor: totalAlunos,
      subtitulo: `${totalTurmas} turmas ativas`,
      Icone: Users,
      iconColor: "var(--brand-primary)",
      iconBg: "var(--bg-sidebar-active)",
      valueColor: "var(--text-primary)",
      descricao: "Quantidade de alunos com matrícula ativa (status ATIVO) no recorte selecionado. Alunos transferidos ou inativos não entram na contagem.",
    },
    {
      titulo: "Média Geral",
      valor: mediaGeral.toFixed(1),
      subtitulo: "Média dos alunos ativos",
      Icone: Target,
      iconColor: "#7A5800",
      iconBg: "var(--status-warning-tint)",
      valueColor: "var(--text-primary)",
      descricao: "Média aritmética de todas as notas lançadas para alunos ativos no recorte selecionado (turma/bimestre/ano). Não é o critério que define aluno crítico — isso depende da quantidade de disciplinas em risco por aluno.",
    },
    {
      titulo: "Alunos Críticos",
      valor: alunosCriticos,
      subtitulo: `${alunosAbaixoBasico} abaixo do básico`,
      Icone: AlertTriangle,
      iconColor: "#FFFFFF",
      iconBg: "var(--status-danger-bg)",
      valueColor: "var(--status-danger-bg)",
      descricao: "Alunos com 3 ou mais disciplinas em risco (média abaixo de 5, ou soma insuficiente no fechamento do 4º bimestre). É esse aluno que vai a conselho de classe.",
    },
    {
      titulo: "Adequado + Avançado",
      valor: `${percentualAdequado.toFixed(1)}%`,
      subtitulo: `${totalAdequadosOuAvancados} estudantes`,
      Icone: GraduationCap,
      iconColor: "#FFFFFF",
      iconBg: "var(--status-success-bg)",
      valueColor: "var(--status-success-bg)",
      descricao: "Percentual de alunos com média igual ou acima de 7,0 (nível adequado ou avançado), sobre o total de alunos com nota lançada no recorte.",
    },
    {
      titulo: "Disciplina Crítica",
      valor: disciplinaCritica,
      subtitulo: `${disciplinaCriticaPercentual.toFixed(0)}% abaixo do básico`,
      Icone: BookOpen,
      iconColor: "#FFFFFF",
      iconBg: "var(--brand-accent-red)",
      valueColor: "var(--brand-accent-red)",
      descricao: "A disciplina com o maior percentual de notas abaixo de 5,0 no recorte selecionado. Ajuda a identificar onde o reforço pedagógico é mais urgente.",
    },
    {
      titulo: "Pontos de Atenção",
      valor: alunosAtencao,
      subtitulo: "Alunos sinalizados",
      Icone: AlertCircle,
      iconColor: "#7A5800",
      iconBg: "var(--status-warning-tint)",
      valueColor: "#7A5800",
      descricao: "Alunos com 1 ou 2 disciplinas em risco — abaixo do limite de 3 que caracteriza situação crítica, mas que já merecem acompanhamento.",
    },
  ];

  return (
    <section className="space-y-4">
      {turmaFiltrada && (
        <div className="flex justify-end">
          <button
            onClick={() => setMostrarNomes((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 text-sm transition"
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              fontWeight: "var(--font-weight-medium)",
            }}
          >
            {mostrarNomes ? (
              <>
                <EyeOff className="h-4 w-4" />
                Ocultar nomes
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Mostrar nomes
              </>
            )}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cardsBase.map((card) => (
          <div key={card.titulo} style={cardStyle}>
            <div className="flex items-start justify-between gap-4">
              <p
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--text-secondary)" }}
              >
                {card.titulo}
                <InfoTooltip texto={card.descricao} align="start" />
              </p>
              <div
                className="flex items-center justify-center shrink-0 p-2"
                style={{
                  background: card.iconBg,
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <card.Icone className="h-4 w-4" style={{ color: card.iconColor }} />
              </div>
            </div>

            <h2
              className="mt-4 truncate text-2xl tracking-tight"
              style={{ color: card.valueColor, fontWeight: 600 }}
            >
              {card.valor}
            </h2>

            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              {card.subtitulo}
            </p>
          </div>
        ))}

        {turmaFiltrada ? (
          <>
            {/* Destaque da Turma */}
            <div style={cardStyle}>
              <div className="flex items-start justify-between gap-4">
                <p
                  className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Destaque da Turma
                  <InfoTooltip
                    align="start"
                    texto="O aluno com a maior média entre todas as disciplinas, considerando apenas as notas já lançadas nesta turma."
                  />
                </p>
                <div
                  className="flex items-center justify-center shrink-0 p-2"
                  style={{ background: "var(--status-success-tint)", borderRadius: "var(--radius-sm)" }}
                >
                  <TrendingUp className="h-4 w-4" style={{ color: "var(--status-success-bg)" }} />
                </div>
              </div>

              {melhorAluno ? (
                <>
                  <Link
                    href={`/dashboard/aluno/${melhorAluno.id}`}
                    className="mt-4 block truncate text-lg hover:underline"
                    style={{ color: "var(--status-success-bg)", fontWeight: 600 }}
                  >
                    {rotulo(melhorAluno, mostrarNomes)}
                  </Link>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    Média {melhorAluno.media?.toFixed(1) ?? "-"} · melhor da sala
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Sem dados
                </p>
              )}
            </div>

            {/* Alertas da Turma */}
            <div style={cardStyle}>
              <div className="flex items-start justify-between gap-4">
                <p
                  className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Alertas da Turma
                  <InfoTooltip
                    align="start"
                    texto="Os alunos com as menores médias desta turma, considerando apenas as notas já lançadas. Não é necessariamente a lista de alunos críticos — veja o card Alunos Críticos para esse critério."
                  />
                </p>
                <div
                  className="flex items-center justify-center shrink-0 p-2"
                  style={{ background: "var(--status-danger-tint)", borderRadius: "var(--radius-sm)" }}
                >
                  <TrendingDown className="h-4 w-4" style={{ color: "var(--status-danger-bg)" }} />
                </div>
              </div>

              {pioresAlunos.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {pioresAlunos.map((a, idx) => (
                    <li key={a.id} className="flex items-center gap-3">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center text-xs font-semibold"
                        style={{
                          background: "var(--status-danger-tint)",
                          color: "var(--status-danger-bg)",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <Link
                        href={`/dashboard/aluno/${a.id}`}
                        className="min-w-0 flex-1 truncate text-sm hover:underline"
                        style={{ color: "var(--status-danger-bg)", fontWeight: "var(--font-weight-medium)" }}
                      >
                        {rotulo(a, mostrarNomes)}
                      </Link>
                      <span
                        className="shrink-0 text-sm"
                        style={{ color: "var(--status-danger-bg)", fontWeight: 600 }}
                      >
                        {a.media?.toFixed(1) ?? "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Sem dados
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={cardStyle}>
              <div className="flex items-start justify-between gap-4">
                <p
                  className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Melhor Turma
                  <InfoTooltip
                    align="start"
                    texto="A turma com a maior média geral entre as turmas visíveis para você neste recorte de bimestre/ano letivo."
                  />
                </p>
                <div
                  className="flex items-center justify-center shrink-0 p-2"
                  style={{ background: "var(--status-success-tint)", borderRadius: "var(--radius-sm)" }}
                >
                  <TrendingUp className="h-4 w-4" style={{ color: "var(--status-success-bg)" }} />
                </div>
              </div>
              <h2
                className="mt-4 truncate text-xl"
                style={{ color: "var(--status-success-bg)", fontWeight: 600 }}
              >
                {melhorTurma}
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                Média {melhorTurmaMedia.toFixed(1)}
              </p>
            </div>

            <div style={cardStyle}>
              <div className="flex items-start justify-between gap-4">
                <p
                  className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Turma em Alerta
                  <InfoTooltip
                    align="start"
                    texto="A turma com a menor média geral entre as turmas visíveis para você neste recorte de bimestre/ano letivo — a que mais precisa de atenção pedagógica agora."
                  />
                </p>
                <div
                  className="flex items-center justify-center shrink-0 p-2"
                  style={{ background: "var(--status-danger-tint)", borderRadius: "var(--radius-sm)" }}
                >
                  <TrendingDown className="h-4 w-4" style={{ color: "var(--status-danger-bg)" }} />
                </div>
              </div>
              <h2
                className="mt-4 truncate text-xl"
                style={{ color: "var(--status-danger-bg)", fontWeight: 600 }}
              >
                {turmaAlerta}
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                Média {turmaAlertaMedia.toFixed(1)}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
