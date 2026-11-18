import { AlertCircle } from "lucide-react";

type Props = { alertas: string[] };

export default function AlertasTextoList({ alertas }: Props) {
  if (alertas.length === 0) return null;

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "var(--brand-primary)" }} />
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Observacoes Automaticas
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Geradas automaticamente com base nos dados do bimestre atual
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {alertas.map((alerta, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl border p-4"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-app)" }}
          >
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: "var(--bg-sidebar-active)", color: "var(--brand-primary)" }}
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {alerta}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
