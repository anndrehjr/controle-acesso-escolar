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

export default function PreReprovadosModal({ executivo }: Props) {
  const {
    snapshots,
    bimestresComDados,
    entraramNoCritico,
    sairamDoCritico,
    alunosCriticosGeral,
    alunosCriticosFundamental,
    alunosCriticosMedio,
  } = executivo;
  const checkpoints = snapshots.filter((s) => bimestresComDados.includes(s.bimestre));

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
          Evolução histórica — alunos pré-reprovados (3+ disciplinas em risco)
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {snapshots.map((s) => (
            <div key={s.bimestre} style={statBox}>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
              <p className="mt-1 text-2xl font-black" style={{ color: s.temDados ? "var(--status-danger-bg)" : "var(--text-secondary)" }}>
                {s.temDados ? s.criticos : "—"}
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {s.temDados ? "alunos" : "sem dados ainda"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {(entraramNoCritico > 0 || sairamDoCritico > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div style={{ ...statBox, borderColor: "var(--status-danger-bg)" }}>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" style={{ color: "var(--status-danger-bg)" }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--status-danger-bg)" }}>Entraram em pré-reprovação</p>
            </div>
            <p className="mt-2 text-3xl font-black" style={{ color: "var(--status-danger-bg)" }}>{entraramNoCritico}</p>
          </div>
          <div style={{ ...statBox, borderColor: "var(--status-success-bg)" }}>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4" style={{ color: "var(--status-success-bg)" }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--status-success-bg)" }}>Saíram da pré-reprovação</p>
            </div>
            <p className="mt-2 text-3xl font-black" style={{ color: "var(--status-success-bg)" }}>{sairamDoCritico}</p>
          </div>
        </div>
      )}

      {checkpoints.length < 2 && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Ainda só há dados de um bimestre — a comparação de entrada/saída da pré-reprovação aparece a partir do 2º bimestre com notas lançadas.
        </p>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
          Situação atual por nível de ensino
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div style={statBox}>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Ensino Fundamental</p>
            <p className="mt-1 text-2xl font-black">{alunosCriticosFundamental}</p>
          </div>
          <div style={statBox}>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Ensino Médio</p>
            <p className="mt-1 text-2xl font-black">{alunosCriticosMedio}</p>
          </div>
          <div style={{ ...statBox, background: "var(--bg-sidebar-active)" }}>
            <p className="text-xs" style={{ color: "var(--brand-primary)" }}>Total Geral</p>
            <p className="mt-1 text-2xl font-black" style={{ color: "var(--brand-primary)" }}>{alunosCriticosGeral}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
