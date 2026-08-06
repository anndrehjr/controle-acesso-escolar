"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import StyledSelect from "../StyledSelect";

type Turma = { id: string; nome: string };

type Props = {
  turmas: Turma[];
  turmaAtualId: string | null;
};

export default function TurmaSeletor({ turmas, turmaAtualId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
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
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-secondary)" }}
      >
        Turma
      </span>
      <StyledSelect
        value={turmaAtualId ?? ""}
        onChange={(e) => selecionar(e.target.value)}
        disabled={pending}
        className="rounded-2xl py-2 pl-4 text-sm font-bold"
      >
        <option value="">Todas</option>
        {turmas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </StyledSelect>
    </div>
  );
}
