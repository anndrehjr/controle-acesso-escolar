"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { ExecutivoResult } from "../../lib/analytics/buildExecutivo";

type Props = { executivo: ExecutivoResult };

const statBox: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg-app)",
  padding: "14px 16px",
};

export default function ZonaAtencaoModal({ executivo }: Props) {
  const { snapshots, bimestresComDados, entraramNaAtencao, sairamDaAtencao } = executivo;
  const checkpoints = snapshots.filter((s) => bimestresComDados.includes(s.bimestre));
  const atencaoAnterior = checkpoints.length > 1 ? checkpoints[checkpoints.length - 2].atencao : null;

  const percentualMelhoria = atencaoAnterior ? Number(((sairamDaAtencao / atencaoAnterior) * 100).toFixed(0)) : null;
  const percentualPiora = atencaoAnterior ? Number(((entraramNaAtencao / atencaoAnterior) * 100).toFixed(0)) : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
          Evolução histórica — alunos em zona de atenção (1–2 disciplinas em risco)
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {snapshots.map((s) => (
            <div key={s.bimestre} style={statBox}>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
              <p className="mt-1 text-2xl font-black" style={{ color: s.temDados ? "var(--status-warning-bg)" : "var(--text-secondary)" }}>
                {s.temDados ? s.atencao : "—"}
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {s.temDados ? "alunos" : "sem dados ainda"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {(entraramNaAtencao > 0 || sairamDaAtencao > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div style={{ ...statBox, borderColor: "var(--status-danger-bg)" }}>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" style={{ color: "var(--status-danger-bg)" }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--status-danger-bg)" }}>Entraram na zona de atenção</p>
            </div>
            <p className="mt-2 text-3xl font-black" style={{ color: "var(--status-danger-bg)" }}>{entraramNaAtencao}</p>
            {percentualPiora !== null && (
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{percentualPiora}% em relação ao bimestre anterior</p>
            )}
          </div>
          <div style={{ ...statBox, borderColor: "var(--status-success-bg)" }}>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4" style={{ color: "var(--status-success-bg)" }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--status-success-bg)" }}>Saíram da zona de atenção</p>
            </div>
            <p className="mt-2 text-3xl font-black" style={{ color: "var(--status-success-bg)" }}>{sairamDaAtencao}</p>
            {percentualMelhoria !== null && (
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{percentualMelhoria}% de melhoria em relação ao bimestre anterior</p>
            )}
          </div>
        </div>
      )}

      {checkpoints.length < 2 && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Ainda só há dados de um bimestre — a comparação de entrada/saída da zona de atenção aparece a partir do 2º bimestre com notas lançadas.
        </p>
      )}
    </div>
  );
}
