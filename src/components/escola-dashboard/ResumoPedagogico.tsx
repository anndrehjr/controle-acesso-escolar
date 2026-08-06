type Props = {
  alunosAtencao: number;
  alunosTransferidos: number;
  totalNotas: number;
  bimestre: number;
  anoLetivo: number;
};

const WarningIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

const TransferIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const NotesIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const AcademicIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

export default function ResumoPedagogico({
  alunosAtencao,
  alunosTransferidos,
  totalNotas,
  bimestre,
  anoLetivo,
}: Props) {
  const itens = [
    {
      titulo: "Em atenção",
      valor: alunosAtencao,
      icon: <WarningIcon />,
      iconBg: alunosAtencao > 0 ? "var(--status-warning-tint)" : "var(--bg-app)",
      iconColor: alunosAtencao > 0 ? "#E8860C" : "var(--text-secondary)",
      valueColor: alunosAtencao > 0 ? "#E8860C" : "var(--text-primary)",
    },
    {
      titulo: "Transferidos",
      valor: alunosTransferidos,
      icon: <TransferIcon />,
      iconBg: "var(--bg-app)",
      iconColor: "var(--text-secondary)",
      valueColor: "var(--text-primary)",
    },
    {
      titulo: "Notas válidas",
      valor: totalNotas.toLocaleString("pt-BR"),
      icon: <NotesIcon />,
      iconBg: "var(--bg-sidebar-active)",
      iconColor: "var(--brand-primary)",
      valueColor: "var(--text-primary)",
    },
    {
      titulo: "Bimestre atual",
      valor: `${bimestre}º`,
      icon: <CalendarIcon />,
      iconBg: "var(--bg-sidebar-active)",
      iconColor: "var(--brand-primary)",
      valueColor: "var(--brand-primary)",
    },
    {
      titulo: "Ano letivo",
      valor: anoLetivo,
      icon: <AcademicIcon />,
      iconBg: "var(--bg-app)",
      iconColor: "var(--text-secondary)",
      valueColor: "var(--text-primary)",
    },
  ];

  return (
    <div
      className="p-6 md:p-8"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="mb-6">
        <div
          className="mb-2 inline-flex px-3 py-1 text-xs font-medium"
          style={{
            background: "var(--bg-app)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-pill)",
            color: "var(--text-secondary)",
          }}
        >
          Síntese pedagógica
        </div>
        <h2
          className="text-lg tracking-tight"
          style={{ color: "var(--text-primary)", fontWeight: 600 }}
        >
          Resumo Pedagógico
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {itens.map((item) => (
          <div
            key={item.titulo}
            className="p-4 transition"
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-app)",
            }}
          >
            <div
              className="mb-3 flex h-8 w-8 items-center justify-center"
              style={{
                background: item.iconBg,
                borderRadius: "var(--radius-sm)",
                color: item.iconColor,
              }}
            >
              {item.icon}
            </div>
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              {item.titulo}
            </p>
            <h3
              className="mt-1 text-2xl"
              style={{ color: item.valueColor, fontWeight: 600 }}
            >
              {item.valor}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}
