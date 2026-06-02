"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  bimestreAtual: number;
};

export default function BimestreSeletor({ bimestreAtual }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function selecionar(b: number) {
    startTransition(() => {
      router.push(`/dashboard?bimestre=${b}`);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Bimestre
      </span>
      {[1, 2, 3, 4].map((b) => (
        <button
          key={b}
          onClick={() => selecionar(b)}
          disabled={pending}
          className={`rounded-full px-3.5 py-1.5 text-sm font-black transition disabled:opacity-50 ${
            bimestreAtual === b
              ? "bg-white text-black shadow-lg"
              : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-white/30 hover:text-white"
          }`}
        >
          {b}º
        </button>
      ))}
    </div>
  );
}
