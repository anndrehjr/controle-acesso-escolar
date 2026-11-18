"use client";

import type { ExecutivoResult } from "../../lib/analytics/buildExecutivo";

type Props = { executivo: ExecutivoResult };

const statBox: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg-app)",
  padding: "14px 16px",
};

export default function TotalAlunosModal({ executivo }: Props) {
  const { totalAtivos, totalTransferidos, matriculaPorTurma } = executivo;
  const totalGeral = totalAtivos + totalTransferidos;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div style={statBox}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Ativos</p>
          <p className="mt-1 text-2xl font-black" style={{ color: "var(--status-success-bg)" }}>{totalAtivos}</p>
        </div>
        <div style={statBox}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Transferidos</p>
          <p className="mt-1 text-2xl font-black" style={{ color: "var(--text-secondary)" }}>{totalTransferidos}</p>
        </div>
        <div style={{ ...statBox, background: "var(--bg-sidebar-active)" }}>
          <p className="text-xs" style={{ color: "var(--brand-primary)" }}>Total matriculado</p>
          <p className="mt-1 text-2xl font-black" style={{ color: "var(--brand-primary)" }}>{totalGeral}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
          Por turma
        </p>
        <div className="overflow-x-auto" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-app)" }}>
                <th className="p-2.5 text-left text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Turma</th>
                <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Ativos</th>
                <th className="p-2.5 text-right text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>Transferidos</th>
              </tr>
            </thead>
            <tbody>
              {matriculaPorTurma.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td className="p-2.5 font-medium">{t.nome}</td>
                  <td className="p-2.5 text-right">{t.ativos}</td>
                  <td className="p-2.5 text-right" style={{ color: t.transferidos > 0 ? "var(--text-secondary)" : "var(--border-subtle)" }}>
                    {t.transferidos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--text-secondary)", opacity: 0.8 }}>
        Situação atual da matrícula. O sistema não guarda a data de cada transferência, então não é
        possível mostrar uma evolução de entrada/saída por bimestre com precisão — só a foto de agora.
      </p>
    </div>
  );
}
