"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

type BimestreSnapshot = {
  bimestre: number;
  temDados: boolean;
  mediaGeral: number;
  totalAlunos: number;
  alunosCriticos: number;
  percentualAdequado: number;
  disciplinas: {
    id: string;
    nome: string;
    percentualCritico: number;
    totalNotas: number;
  }[];
  mediasPorAluno: {
    alunoId: string;
    nome: string;
    numeroChamada: number;
    media: number;
  }[];
};

type ComparativoData = {
  turma: { id: string; nome: string };
  b1: BimestreSnapshot;
  b2: BimestreSnapshot;
};

type Props = { turmaId: string };

function DeltaBadge({
  delta,
  invertido = false,
  sufixo = "",
}: {
  delta: number;
  invertido?: boolean;
  sufixo?: string;
}) {
  if (Math.abs(delta) < 0.05) {
    return <span className="text-zinc-600 text-sm font-bold">sem variação</span>;
  }
  const bom = invertido ? delta < 0 : delta > 0;
  const sinal = delta > 0 ? "+" : "";
  const classeTexto = bom ? "text-green-400" : "text-red-400";
  const classeBg = bom ? "bg-green-500/15 border-green-500/30" : "bg-red-500/15 border-red-500/30";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-black ${classeTexto} ${classeBg}`}
    >
      {sinal}{delta.toFixed(1)}{sufixo}
      {bom ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
    </span>
  );
}

function KPICard({
  titulo,
  b1,
  b2,
  delta,
}: {
  titulo: string;
  b1: string;
  b2: string;
  delta: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_50%)]" />
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{titulo}</p>
        <div className="mt-4 flex items-end gap-3">
          <div className="text-center">
            <p className="mb-1 text-xs font-medium text-zinc-600">1º Bim</p>
            <p className="text-3xl font-black text-zinc-400">{b1}</p>
          </div>
          <p className="mb-1 text-xl font-black text-zinc-700">→</p>
          <div className="text-center">
            <p className="mb-1 text-xs font-medium text-zinc-400">2º Bim</p>
            <p className="text-3xl font-black text-white">{b2}</p>
          </div>
        </div>
        <div className="mt-4">{delta}</div>
      </div>
    </div>
  );
}

function BarraDupla({ p1, p2 }: { p1: number | null; p2: number | null }) {
  return (
    <div className="flex flex-col gap-1">
      {p1 !== null && (
        <div className="flex items-center gap-2">
          <span className="w-6 text-right text-xs text-zinc-500">B1</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-500 transition-all duration-700"
              style={{ width: `${Math.min(p1, 100)}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-bold text-zinc-400">{Math.round(p1)}%</span>
        </div>
      )}
      {p2 !== null && (
        <div className="flex items-center gap-2">
          <span className="w-6 text-right text-xs text-zinc-400">B2</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                p2 >= 30
                  ? "bg-red-500"
                  : p2 >= 20
                  ? "bg-yellow-500"
                  : p2 >= 10
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(p2, 100)}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-black text-white">{Math.round(p2)}%</span>
        </div>
      )}
    </div>
  );
}

export default function ComparativoBimestres({ turmaId }: Props) {
  const [data, setData] = useState<ComparativoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);
        const res = await fetch(`/api/dashboard/comparativo?turma=${turmaId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erro ao carregar comparativo");
        setData(json);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro inesperado");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [turmaId]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-zinc-400 shadow-2xl backdrop-blur">
        Carregando comparativo...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-3xl border border-red-900 bg-red-950/30 p-8 text-red-300 shadow-2xl backdrop-blur">
        Erro: {erro}
      </div>
    );
  }

  if (!data) return null;

  const { turma, b1, b2 } = data;

  // Disciplines comparison — union of both bimestres
  const allDiscIds = [
    ...new Set([
      ...b1.disciplinas.map((d) => d.id),
      ...b2.disciplinas.map((d) => d.id),
    ]),
  ];
  const discComparacao = allDiscIds
    .map((id) => {
      const d1 = b1.disciplinas.find((d) => d.id === id);
      const d2 = b2.disciplinas.find((d) => d.id === id);
      const nome = d1?.nome ?? d2?.nome ?? "—";
      const p1 = d1?.percentualCritico ?? null;
      const p2 = d2?.percentualCritico ?? null;
      const delta = p1 !== null && p2 !== null ? p2 - p1 : null;
      return { id, nome, p1, p2, delta };
    })
    .sort((a, b) => (b.p2 ?? b.p1 ?? 0) - (a.p2 ?? a.p1 ?? 0));

  // Student comparison
  const mapaB1 = new Map(b1.mediasPorAluno.map((a) => [a.alunoId, a.media]));
  const comparacaoAlunos = b2.mediasPorAluno
    .filter((a2) => mapaB1.has(a2.alunoId))
    .map((a2) => ({
      ...a2,
      mediaB1: mapaB1.get(a2.alunoId)!,
      delta: a2.media - mapaB1.get(a2.alunoId)!,
    }));

  const melhoraram = [...comparacaoAlunos]
    .sort((a, b) => b.delta - a.delta)
    .filter((a) => a.delta > 0.05)
    .slice(0, 5);

  const regrediram = [...comparacaoAlunos]
    .sort((a, b) => a.delta - b.delta)
    .filter((a) => a.delta < -0.05)
    .slice(0, 5);

  const semDados = !b1.temDados && !b2.temDados;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
            Análise comparativa
          </div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            Comparativo de Bimestres — {turma.nome}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-base">
            Evolução do desempenho entre o 1º e o 2º bimestre.{" "}
            {!b1.temDados && (
              <span className="text-yellow-400">1º bimestre sem dados.</span>
            )}
            {!b2.temDados && (
              <span className="text-yellow-400"> 2º bimestre sem dados.</span>
            )}
          </p>
        </div>
      </div>

      {semDados ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-center text-zinc-400 shadow-2xl backdrop-blur">
          Nenhum dado encontrado para esta turma nos bimestres 1 e 2.
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <KPICard
              titulo="Média Geral"
              b1={b1.temDados ? b1.mediaGeral.toFixed(1) : "—"}
              b2={b2.temDados ? b2.mediaGeral.toFixed(1) : "—"}
              delta={
                b1.temDados && b2.temDados ? (
                  <DeltaBadge delta={b2.mediaGeral - b1.mediaGeral} />
                ) : (
                  <span className="text-zinc-600 text-sm">sem comparação</span>
                )
              }
            />
            <KPICard
              titulo="Alunos Críticos"
              b1={b1.temDados ? String(b1.alunosCriticos) : "—"}
              b2={b2.temDados ? String(b2.alunosCriticos) : "—"}
              delta={
                b1.temDados && b2.temDados ? (
                  <DeltaBadge
                    delta={b2.alunosCriticos - b1.alunosCriticos}
                    invertido
                  />
                ) : (
                  <span className="text-zinc-600 text-sm">sem comparação</span>
                )
              }
            />
            <KPICard
              titulo="Adequado / Avançado"
              b1={b1.temDados ? `${b1.percentualAdequado.toFixed(0)}%` : "—"}
              b2={b2.temDados ? `${b2.percentualAdequado.toFixed(0)}%` : "—"}
              delta={
                b1.temDados && b2.temDados ? (
                  <DeltaBadge
                    delta={b2.percentualAdequado - b1.percentualAdequado}
                    sufixo="pp"
                  />
                ) : (
                  <span className="text-zinc-600 text-sm">sem comparação</span>
                )
              }
            />
          </div>

          {/* Disciplines table */}
          {discComparacao.length > 0 && (
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
              <div className="relative z-10 mb-6">
                <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
                  Disciplinas
                </div>
                <h3 className="text-xl font-black tracking-tight md:text-2xl">
                  Componentes Curriculares — B1 vs B2
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Percentual de notas abaixo do básico por disciplina.
                </p>
              </div>
              <div className="relative z-10 space-y-4">
                {discComparacao.map((disc) => (
                  <div
                    key={disc.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="font-bold text-zinc-100">{disc.nome}</span>
                      <div className="flex items-center gap-2">
                        {disc.delta !== null && (
                          <DeltaBadge delta={-disc.delta} sufixo="pp" />
                        )}
                      </div>
                    </div>
                    <BarraDupla p1={disc.p1} p2={disc.p2} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student evolution */}
          {comparacaoAlunos.length > 0 && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Mais evoluíram */}
              <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.06),transparent_50%)]" />
                <div className="relative z-10 mb-5">
                  <div className="mb-3 inline-flex rounded-full border border-green-900/60 bg-green-950/40 px-3 py-1 text-xs font-medium text-green-400">
                    Evolução positiva
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Mais evoluíram</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Alunos que mais melhoraram do B1 para o B2.
                  </p>
                </div>
                <div className="relative z-10 space-y-3">
                  {melhoraram.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      Nenhum aluno melhorou entre os bimestres.
                    </p>
                  ) : (
                    melhoraram.map((aluno, idx) => (
                      <div
                        key={aluno.alunoId}
                        className="flex items-center gap-3 rounded-2xl border border-green-900/30 bg-green-950/20 px-4 py-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-green-900/40 bg-green-950/60 text-sm font-black text-green-400">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-green-100">{aluno.nome}</p>
                          <p className="text-xs text-zinc-500">
                            {aluno.mediaB1.toFixed(1)} → {aluno.media.toFixed(1)}
                          </p>
                        </div>
                        <DeltaBadge delta={aluno.delta} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Mais regrediram */}
              <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur md:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.06),transparent_50%)]" />
                <div className="relative z-10 mb-5">
                  <div className="mb-3 inline-flex rounded-full border border-red-900/60 bg-red-950/40 px-3 py-1 text-xs font-medium text-red-400">
                    Atenção
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Mais regrediram</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Alunos que mais declinaram do B1 para o B2.
                  </p>
                </div>
                <div className="relative z-10 space-y-3">
                  {regrediram.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      Nenhum aluno regrediu entre os bimestres.
                    </p>
                  ) : (
                    regrediram.map((aluno, idx) => (
                      <div
                        key={aluno.alunoId}
                        className="flex items-center gap-3 rounded-2xl border border-red-900/30 bg-red-950/20 px-4 py-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-900/40 bg-red-950/60 text-sm font-black text-red-400">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-red-100">{aluno.nome}</p>
                          <p className="text-xs text-zinc-500">
                            {aluno.mediaB1.toFixed(1)} → {aluno.media.toFixed(1)}
                          </p>
                        </div>
                        <DeltaBadge delta={aluno.delta} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
