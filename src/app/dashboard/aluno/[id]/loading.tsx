export default function AlunoLoading() {
  return (
    <main
      className="min-h-screen p-6 md:p-8 animate-pulse"
      style={{ background: "var(--bg-app)" }}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Back button + header card */}
        <div>
          <div
            className="mb-6 h-10 w-44 rounded-2xl"
            style={{ background: "var(--border-subtle)" }}
          />
          <div
            className="rounded-3xl border p-6 md:p-8"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}
          >
            <div className="space-y-4">
              <div className="h-3 w-40 rounded-full" style={{ background: "var(--border-subtle)" }} />
              <div className="h-9 w-80 rounded-2xl" style={{ background: "var(--border-subtle)" }} />
              <div className="h-4 w-48 rounded-lg" style={{ background: "var(--border-subtle)" }} />
            </div>
          </div>
        </div>

        {/* Table card */}
        <div
          className="rounded-3xl border p-6 md:p-8"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}
        >
          <div className="mb-6 space-y-2">
            <div className="h-6 w-48 rounded-xl" style={{ background: "var(--border-subtle)" }} />
            <div className="h-4 w-32 rounded" style={{ background: "var(--border-subtle)" }} />
          </div>
          <div className="space-y-2">
            <div className="h-10 rounded-xl" style={{ background: "var(--bg-app)" }} />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl" style={{ background: "var(--border-subtle)" }} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}