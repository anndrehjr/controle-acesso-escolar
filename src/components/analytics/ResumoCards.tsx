import { TrendingUp, TrendingDown, Users, AlertTriangle, BookOpen, Award, Target } from "lucide-react";
import InfoTooltip from "../InfoTooltip";

type Props = {
  mediaGeral: number;
  deltaMedia: number | null;
  totalAlunos: number;
  alunosCriticos: number;
  alunosAtencao: number;
  melhorDisciplina: string;
  piorDisciplina: string;
  melhorTurma: string;
  melhorTurmaMedia: number;
  turmaMaisEvoluiu: string;
  deltaTurmaMaisEvoluiu: number | null;
  bimestre: number;
};

function corMedia(m: number) {
  if (m < 5) return "#ef4444";
  if (m < 7) return "#eab308";
  if (m < 9) return "#22c55e";
  return "#3b82f6";
}

function nivel(m: number) {
  if (m < 5) return "Abaixo do Basico";
  if (m < 7) return "Basico";
  if (m < 9) return "Adequado";
  return "Avancado";
}

const base: React.CSSProperties = {
  background: "var(--bg-card)",
  borderColor: "var(--border-subtle)",
  boxShadow: "var(--shadow-card)",
};

const sep: React.CSSProperties = {
  borderTop: "1px solid var(--border-subtle)",
};

export default function ResumoCards({
  mediaGeral, deltaMedia, totalAlunos, alunosCriticos, alunosAtencao,
  melhorDisciplina, piorDisciplina, melhorTurma, melhorTurmaMedia,
  turmaMaisEvoluiu, deltaTurmaMaisEvoluiu, bimestre,
}: Props) {
  const deltaLabel = deltaMedia !== null
    ? (deltaMedia >= 0 ? "+" + deltaMedia.toFixed(1) : deltaMedia.toFixed(1)) + " vs bim anterior"
    : bimestre + "o bimestre";
  const deltaCor = deltaMedia !== null && deltaMedia < 0 ? "#ef4444" : "#22c55e";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl border p-5" style={base}>
        <div className="flex items-center justify-between mb-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Media Geral
            <InfoTooltip align="start" texto="Média aritmética de todas as notas lançadas no bimestre selecionado. Não é o critério que define aluno crítico." />
          </p>
          <Target className="h-5 w-5" style={{ color: corMedia(mediaGeral) }} />
        </div>
        <p className="text-4xl font-black" style={{ color: corMedia(mediaGeral) }}>{mediaGeral.toFixed(1)}</p>
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{nivel(mediaGeral)} - {bimestre}o bimestre</p>
        <p className="mt-3 text-xs font-semibold pt-3" style={{ color: deltaCor, ...sep }}>{deltaLabel}</p>
      </div>

      <div className="rounded-2xl border p-5" style={base}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Total de Alunos</p>
          <Users className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
        </div>
        <p className="text-4xl font-black" style={{ color: "var(--text-primary)" }}>{totalAlunos}</p>
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>alunos ativos</p>
        <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>{alunosAtencao} em zona de atencao</p>
      </div>

      <div className="rounded-2xl border p-5" style={base}>
        <div className="flex items-center justify-between mb-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Alunos Pré-Reprovados
            <InfoTooltip align="start" texto="Alunos com 3 ou mais disciplinas em risco (média abaixo de 5, ou soma insuficiente no fechamento do 4º bimestre). É esse aluno que vai a conselho de classe." />
          </p>
          <AlertTriangle className="h-5 w-5" style={{ color: alunosCriticos > 0 ? "#ef4444" : "#22c55e" }} />
        </div>
        <p className="text-4xl font-black" style={{ color: alunosCriticos > 0 ? "#ef4444" : "#22c55e" }}>{alunosCriticos}</p>
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>3+ disciplinas em risco</p>
        <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>
          {alunosCriticos === 0 ? "Nenhum em estado critico" : "Necessitam intervencao"}
        </p>
      </div>

      <div className="rounded-2xl border p-5" style={base}>
        <div className="flex items-center justify-between mb-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Zona de Atencao
            <InfoTooltip align="start" texto="Alunos com 1 ou 2 disciplinas em risco — abaixo do limite de 3 que caracteriza situação crítica, mas que já merecem acompanhamento." />
          </p>
          <TrendingDown className="h-5 w-5" style={{ color: "#eab308" }} />
        </div>
        <p className="text-4xl font-black" style={{ color: "#eab308" }}>{alunosAtencao}</p>
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>1-2 disciplinas em risco</p>
        <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>Acompanhamento pedagogico</p>
      </div>

      <div className="rounded-2xl border p-5" style={base}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Melhor Disciplina</p>
          <Award className="h-5 w-5" style={{ color: "#22c55e" }} />
        </div>
        <p className="text-lg font-black leading-tight" style={{ color: "#22c55e" }}>{melhorDisciplina}</p>
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>maior media do bimestre</p>
        <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>Desempenho positivo</p>
      </div>

      <div className="rounded-2xl border p-5" style={base}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Maior Dificuldade</p>
          <BookOpen className="h-5 w-5" style={{ color: "#ef4444" }} />
        </div>
        <p className="text-lg font-black leading-tight" style={{ color: "#ef4444" }}>{piorDisciplina}</p>
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>maior indice abaixo da media</p>
        <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>Requer atencao pedagogica</p>
      </div>

      <div className="rounded-2xl border p-5" style={base}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Melhor Turma</p>
          <Award className="h-5 w-5" style={{ color: "#22c55e" }} />
        </div>
        <p className="text-xl font-black leading-tight" style={{ color: "#22c55e" }}>{melhorTurma}</p>
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>media {melhorTurmaMedia.toFixed(1)}</p>
        <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>Melhor desempenho da escola</p>
      </div>

      <div className="rounded-2xl border p-5" style={base}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Turma Mais Evoluiu</p>
          <TrendingUp className="h-5 w-5" style={{ color: "#3b82f6" }} />
        </div>
        <p className="text-xl font-black leading-tight" style={{ color: "#3b82f6" }}>{turmaMaisEvoluiu}</p>
        {deltaTurmaMaisEvoluiu !== null && (
          <p className="mt-1 text-xs font-medium" style={{ color: "#3b82f6" }}>
            {deltaTurmaMaisEvoluiu >= 0 ? "+" : ""}{deltaTurmaMaisEvoluiu.toFixed(1)} pontos
          </p>
        )}
        <p className="mt-3 text-xs pt-3" style={{ color: "var(--text-secondary)", ...sep }}>Maior crescimento vs bim anterior</p>
      </div>
    </div>
  );
}
