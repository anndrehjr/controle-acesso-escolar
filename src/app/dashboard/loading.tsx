export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-zinc-900 p-6 md:p-8 animate-pulse">
      {/* Header */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-8">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-zinc-800 md:h-20 md:w-20" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-3 w-24 rounded-full bg-zinc-800" />
            <div className="h-9 w-72 rounded-2xl bg-zinc-800" />
            <div className="h-4 w-48 rounded-lg bg-zinc-800/60" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-2">
        <div className="grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-2xl bg-zinc-800/60" />
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6"
          >
            <div className="flex justify-between">
              <div className="h-3 w-24 rounded bg-zinc-800" />
              <div className="h-10 w-10 rounded-2xl bg-zinc-800/60" />
            </div>
            <div className="mt-7 h-8 w-24 rounded-xl bg-zinc-800" />
            <div className="mt-2 h-3 w-36 rounded bg-zinc-800/40" />
          </div>
        ))}
      </div>
    </main>
  );
}
