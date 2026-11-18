"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

type Props = {
  bimestreAtual: number;
};

export default function BimestreSeletor({ bimestreAtual }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function selecionar(b: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("bimestre", String(b));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="mr-1 text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-secondary)" }}
      >
        Bimestre
      </span>
      {[1, 2, 3, 4].map((b) => (
        <button
          key={b}
          onClick={() => selecionar(b)}
          disabled={pending}
          className={`rounded-full px-3.5 py-1.5 text-sm font-black transition disabled:opacity-50 ${
            bimestreAtual === b ? "shadow-lg" : "border"
          }`}
          style={
            bimestreAtual === b
              ? { background: "var(--bg-card)", color: "var(--text-primary)" }
              : {
                  background: "var(--bg-app)",
                  color: "var(--text-secondary)",
                  borderColor: "var(--border-subtle)",
                }
          }
        >
          {b}
        </button>
      ))}
    </div>
  );
}