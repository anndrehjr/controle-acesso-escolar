"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Turma = { id: string; nome: string };

type Props = {
  turmas: Turma[];
  turmaAtualId: string | null;
};

export default function TurmaSeletor({ turmas, turmaAtualId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function selecionar(turmaId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (turmaId) {
      params.set("turma", turmaId);
    } else {
      params.delete("turma");
    }
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Turma
      </span>
      <select
        value={turmaAtualId ?? ""}
        onChange={(e) => selecionar(e.target.value)}
        disabled={pending}
        className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white outline-none transition hover:border-zinc-500 focus:border-white disabled:opacity-50"
      >
        <option value="">Todas</option>
        {turmas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
