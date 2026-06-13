export default function AlunoLoading() {
  return (
    <main className="min-h-screen bg-zinc-900 p-6 md:p-8 animate-pulse">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Back button + header card */}
        <div>
          <div className="mb-6 h-10 w-44 rounded-2xl bg-zinc-800/60" />
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-8">
            <div className="space-y-4">
              <div className="h-3 w-40 rounded-full bg-zinc-800" />
              <div className="h-9 w-80 rounded-2xl bg-zinc-800" />
              <div className="h-4 w-48 rounded-lg bg-zinc-800/60" />
            </div>
          </div>
        </div>

        {/* Table card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-8">
          <div className="mb-6 space-y-2">
            <div className="h-6 w-48 rounded-xl bg-zinc-800" />
            <div className="h-4 w-32 rounded bg-zinc-800/60" />
          </div>
          <div className="space-y-2">
            <div className="h-10 rounded-xl bg-zinc-900" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-zinc-800/30" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
