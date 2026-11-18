"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

type DisciplinaSnapshot = { id: string; nome: string; percentualCritico: number; totalNotas: number };
type AlunoSnapshot = { alunoId: string; nome: string; numeroChamada: number; media: number };
type BimestreSnapshot = {
  bimestre: number;
  temDados: boolean;
  mediaGeral: number;
  totalAlunos: number;
  alunosCriticos: number;
  percentualAdequado: number;
  disciplinas: DisciplinaSnapshot[];
  mediasPorAluno: AlunoSnapshot[];
};
type ComparativoData = {
  turma: { id: string; nome: string };
  anoLetivo: number;
  bimestreFinal: number;
  bimestres: BimestreSnapshot[];
  indiceRisco: {
    ateBimestre: number;
    mediaLimite: number;
    minimoDisciplinas: number;
    alunos: {
      alunoId: string;
      nome: string;
      numeroChamada: number;
      mediaGeral: number;
      disciplinasCriticas: { disciplinaId: string; nome: string; media: number }[];
    }[];
  };
};
type Props = { turmaId: string; escolaId?: string; bimestreFinal: number };

const CORES_BIMESTRES = [
  "var(--text-secondary)",
  "var(--brand-primary)",
  "#8b5cf6",
  "var(--status-success-bg)",
];
const cardStyle: React.CSSProperties = {
  borderRadius: "1.5rem",
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  boxShadow: "var(--shadow-card)",
};
const pillStyle: React.CSSProperties = {
  borderRadius: "var(--radius-pill)",
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-app)",
  color: "var(--text-secondary)",
};

function DeltaBadge({ delta, invertido = false, percentual = false }: { delta: number; invertido?: boolean; percentual?: boolean }) {
  const valorAbsoluto = Math.abs(delta);
  const semVariacao = percentual ? Math.round(valorAbsoluto) === 0 : valorAbsoluto < 0.05;
  if (semVariacao) {
    return <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--text-secondary)" }}><Minus className="h-3 w-3" /> sem variação</span>;
  }
  const bom = invertido ? delta < 0 : delta > 0;
  const cor = bom ? "var(--status-success-bg)" : "var(--status-danger-bg)";
  const bg = bom ? "var(--status-success-tint)" : "var(--status-danger-tint)";
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-black" style={{ color: cor, background: bg, borderColor: cor }}>
      {delta > 0 ? "+" : "-"}{percentual ? Math.round(valorAbsoluto) : valorAbsoluto.toFixed(1)}{percentual ? "%" : ""}
      {bom ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
    </span>
  );
}

function KPICard({ titulo, snapshots, valor, invertido = false, percentualDelta = false }: {
  titulo: string;
  snapshots: BimestreSnapshot[];
  valor: (snapshot: BimestreSnapshot) => { numero: number; texto: string };
  invertido?: boolean;
  percentualDelta?: boolean;
}) {
  const comDados = snapshots.filter((snapshot) => snapshot.temDados);
  const anterior = comDados.at(-2);
  const atual = comDados.at(-1);
  const delta = anterior && atual ? valor(atual).numero - valor(anterior).numero : null;
  return (
    <div className="relative overflow-hidden p-5 shadow-2xl backdrop-blur md:p-6" style={cardStyle}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_50%)]" />
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>{titulo}</p>
        <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${snapshots.length}, minmax(0, 1fr))` }}>
          {snapshots.map((snapshot) => (
            <div key={snapshot.bimestre} className="min-w-0">
              <p className="mb-1 text-xs font-semibold" style={{ color: CORES_BIMESTRES[snapshot.bimestre - 1] }}>B{snapshot.bimestre}</p>
              <p className="truncate text-2xl font-black md:text-3xl">{snapshot.temDados ? valor(snapshot).texto : "—"}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          {delta === null ? (
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>aguardando dois bimestres com dados</span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <DeltaBadge delta={delta} invertido={invertido} percentual={percentualDelta} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>B{anterior?.bimestre} → B{atual?.bimestre}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BarrasBimestres({ valores }: { valores: { bimestre: number; percentual: number | null }[] }) {
  return (
    <div className="space-y-2">
      {valores.map(({ bimestre, percentual }) => (
        <div key={bimestre} className="flex items-center gap-2">
          <span className="w-7 text-right text-xs font-bold" style={{ color: CORES_BIMESTRES[bimestre - 1] }}>B{bimestre}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border-subtle)" }}>
            {percentual !== null && <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(percentual, 100)}%`, background: CORES_BIMESTRES[bimestre - 1] }} />}
          </div>
          <span className="w-10 text-right text-xs font-bold" style={{ color: percentual === null ? "var(--text-secondary)" : "var(--text-primary)" }}>
            {percentual === null ? "—" : `${Math.round(percentual)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ComparativoBimestres({ turmaId, escolaId, bimestreFinal }: Props) {
  const [data, setData] = useState<ComparativoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);
        const params = new URLSearchParams({ turma: turmaId, ate: String(bimestreFinal) });
        if (escolaId) params.set("escolaId", escolaId);
        const res = await fetch(`/api/dashboard/comparativo?${params}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erro ao carregar comparativo");
        setData(json);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro inesperado");
      } finally {
        setLoading(false);
      }
    }
    void carregar();
  }, [turmaId, escolaId, bimestreFinal, refreshKey]);

  const disciplinas = useMemo(() => {
    if (!data) return [];
    const ids = new Set(data.bimestres.flatMap((snapshot) => snapshot.disciplinas.map((disciplina) => disciplina.id)));
    return [...ids].map((id) => {
      const ocorrencias = data.bimestres.map((snapshot) => snapshot.disciplinas.find((disciplina) => disciplina.id === id));
      const nome = ocorrencias.find(Boolean)?.nome ?? "—";
      const valores = data.bimestres.map((snapshot, indice) => ({
        bimestre: snapshot.bimestre,
        percentual: snapshot.temDados ? ocorrencias[indice]?.percentualCritico ?? 0 : null,
      }));
      const ultimo = [...valores].reverse().find((item) => item.percentual !== null)?.percentual ?? 0;
      return { id, nome, valores, ultimo };
    }).sort((a, b) => b.ultimo - a.ultimo);
  }, [data]);

  if (loading) return <div className="space-y-6 animate-pulse"><div className="h-44" style={cardStyle} /><div className="grid grid-cols-1 gap-6 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-40" style={cardStyle} />)}</div><div className="h-72" style={cardStyle} /></div>;

  if (erro) {
    return (
      <div className="p-8" style={{ ...cardStyle, borderColor: "var(--status-danger-bg)", background: "var(--status-danger-tint)" }}>
        <p style={{ color: "var(--status-danger-bg)" }}>Erro ao carregar comparativo: {erro}</p>
        <button onClick={() => setRefreshKey((atual) => atual + 1)} className="mt-4 rounded-2xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--status-danger-bg)", color: "var(--status-danger-bg)" }}>Tentar novamente</button>
      </div>
    );
  }
  if (!data) return null;

  const semDados = data.bimestres.every((snapshot) => !snapshot.temDados);
  const nomesBimestres = data.bimestres.map((snapshot) => `B${snapshot.bimestre}`).join(", ");
  const bimestresSemDados = data.bimestres.filter((snapshot) => !snapshot.temDados);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden p-6 shadow-2xl backdrop-blur md:p-8" style={cardStyle}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_35%)]" />
        <div className="relative z-10">
          <div className="mb-3 inline-flex px-3 py-1 text-xs font-medium" style={pillStyle}>Análise comparativa</div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">Evolução da turma — {data.turma.nome}</h2>
          <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>Comparação de desempenho entre {nomesBimestres} no ano letivo de {data.anoLetivo}.</p>
          {bimestresSemDados.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {bimestresSemDados.map((snapshot) => <span key={snapshot.bimestre} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "var(--status-warning-bg)", background: "var(--status-warning-tint)", color: "#7A5800" }}>B{snapshot.bimestre} aguardando notas</span>)}
            </div>
          )}
        </div>
      </div>

      {semDados ? <div className="p-8 text-center" style={{ ...cardStyle, color: "var(--text-secondary)" }}>Nenhuma nota encontrada para esta turma no período selecionado.</div> : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <KPICard titulo="Média geral" snapshots={data.bimestres} valor={(snapshot) => ({ numero: snapshot.mediaGeral, texto: snapshot.mediaGeral.toFixed(1) })} />
            <KPICard titulo="Alunos pré-reprovados" snapshots={data.bimestres} valor={(snapshot) => ({ numero: snapshot.alunosCriticos, texto: String(snapshot.alunosCriticos) })} invertido />
            <KPICard titulo="Adequado / avançado" snapshots={data.bimestres} valor={(snapshot) => ({ numero: snapshot.percentualAdequado, texto: `${snapshot.percentualAdequado.toFixed(0)}%` })} percentualDelta />
          </div>

          {disciplinas.length > 0 && (
            <section className="relative overflow-hidden p-6 shadow-2xl backdrop-blur md:p-8" style={cardStyle}>
              <div className="relative z-10 mb-6">
                <div className="mb-3 inline-flex px-3 py-1 text-xs font-medium" style={pillStyle}>Componentes curriculares</div>
                <h3 className="text-xl font-black tracking-tight md:text-2xl">Notas abaixo do básico por disciplina</h3>
                <div className="mt-4 rounded-2xl border p-4 text-sm font-semibold leading-relaxed md:text-base" style={{ borderColor: "var(--border-strong)", background: "var(--bg-app)", color: "var(--text-primary)" }}>
                  Quanto maior a barra, maior a porcentagem de alunos com nota abaixo de 5 naquela disciplina. Quanto menor a barra, melhor o resultado da turma.
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                  {data.bimestres.map((snapshot) => <span key={snapshot.bimestre} className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}><span className="h-2.5 w-2.5 rounded-full" style={{ background: CORES_BIMESTRES[snapshot.bimestre - 1] }} /> B{snapshot.bimestre}</span>)}
                </div>
              </div>
              <div className="relative z-10 grid gap-4 xl:grid-cols-2">
                {disciplinas.map((disciplina) => <div key={disciplina.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)" }}><p className="mb-3 font-bold">{disciplina.nome}</p><BarrasBimestres valores={disciplina.valores} /></div>)}
              </div>
            </section>
          )}

          <section className="p-6 shadow-2xl backdrop-blur md:p-8" style={cardStyle}>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--status-danger-bg)", background: "var(--status-danger-tint)", color: "var(--status-danger-bg)" }}>Índice de risco pedagógico</div>
                <h3 className="text-xl font-black tracking-tight md:text-2xl">Alunos que precisam de intervenção</h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Médias acumuladas do 1º ao {data.indiceRisco.ateBimestre}º bimestre. Aparecem aqui os alunos com {data.indiceRisco.minimoDisciplinas} ou mais disciplinas abaixo de {data.indiceRisco.mediaLimite.toFixed(1)}.
                </p>
              </div>
              <div className="rounded-2xl border px-5 py-3 text-center" style={{ borderColor: "var(--status-danger-bg)", background: "var(--status-danger-tint)" }}>
                <p className="text-3xl font-black" style={{ color: "var(--status-danger-bg)" }}>{data.indiceRisco.alunos.length}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--status-danger-bg)" }}>alunos em risco</p>
              </div>
            </div>

            {data.indiceRisco.alunos.length === 0 ? (
              <div className="rounded-2xl border p-6 text-center text-sm" style={{ borderColor: "var(--status-success-bg)", background: "var(--status-success-tint)", color: "var(--status-success-bg)" }}>
                Nenhum aluno possui {data.indiceRisco.minimoDisciplinas} ou mais disciplinas com média abaixo de {data.indiceRisco.mediaLimite.toFixed(1)} neste período.
              </div>
            ) : (
              <div className="space-y-4">
                {data.indiceRisco.alunos.map((aluno, indice) => (
                  <article key={aluno.alunoId} className="rounded-2xl border p-4 md:p-5" style={{ borderColor: "var(--status-danger-bg)", background: "var(--status-danger-tint)" }}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black" style={{ borderColor: "var(--status-danger-bg)", color: "var(--status-danger-bg)" }}>{indice + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-black">{aluno.nome}</p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Nº {aluno.numeroChamada} · Média geral atual {aluno.mediaGeral.toFixed(1)}</p>
                      </div>
                      <span className="rounded-full border px-3 py-1 text-sm font-black" style={{ borderColor: "var(--status-danger-bg)", color: "var(--status-danger-bg)" }}>{aluno.disciplinasCriticas.length} matérias críticas</span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {aluno.disciplinasCriticas.map((disciplina) => (
                        <div key={disciplina.disciplinaId} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}>
                          <span className="min-w-0 truncate text-sm font-semibold">{disciplina.nome}</span>
                          <span className="shrink-0 text-sm font-black" style={{ color: "var(--status-danger-bg)" }}>{disciplina.media.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
