"use client";

import { useState } from "react";

type HeatmapData = {
  turmaId: string;
  turmaNome: string;
  grupoPedagogico?: string;
  disciplinas: {
    id: string;
    nome: string;
    codigo: string;
  }[];
  alunos: {
    alunoId: string;
    nome: string;
    emAtencao: boolean;
    media: number | null;
    disciplinas: {
      disciplinaId: string;
      disciplinaNome: string;
      codigo: string;
      nota: number | null;
    }[];
  }[];
};

type Props = {
  data: HeatmapData[];
};

function getClasseNota(nota: number | null) {
  if (nota === null) return "bg-zinc-800 text-zinc-500";
  if (nota <= 4) return "bg-red-500/20 text-red-400";
  if (nota <= 6) return "bg-yellow-500/20 text-yellow-400";
  if (nota <= 8) return "bg-green-500/20 text-green-400";
  return "bg-blue-500/20 text-blue-400";
}

export default function HeatmapPedagogico({ data }: Props) {
  const [turmaSelecionada, setTurmaSelecionada] = useState(
    data[0]?.turmaId ?? ""
  );

  const turmaAtual =
    data.find((turma) => turma.turmaId === turmaSelecionada) ??
    data[0];

  if (!turmaAtual) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        Nenhum dado encontrado.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Heatmap Pedagógico</h2>

          <p className="text-zinc-400 mt-1">
            Notas por aluno e disciplina. A média é calculada automaticamente.
          </p>
        </div>

        <select
          value={turmaAtual.turmaId}
          onChange={(e) => setTurmaSelecionada(e.target.value)}
          className="rounded-xl bg-zinc-950 border border-zinc-700 px-4 py-2 text-sm font-bold"
        >
          {data.map((turma) => (
            <option key={turma.turmaId} value={turma.turmaId}>
              {turma.turmaNome}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-[260px] border border-zinc-700 bg-zinc-900 p-2 text-left">
                Aluno
              </th>

              {turmaAtual.disciplinas.map((disciplina) => (
                <th
                  key={disciplina.id}
                  title={disciplina.nome}
                  className="min-w-[64px] border border-zinc-700 bg-zinc-900 p-2 text-center"
                >
                  {disciplina.codigo.replace("C", "")}
                </th>
              ))}

              <th className="min-w-[90px] border border-zinc-700 bg-zinc-900 p-2 text-center">
                Média
              </th>
            </tr>
          </thead>

          <tbody>
            {turmaAtual.alunos.map((aluno) => (
              <tr
                key={aluno.alunoId}
                className={aluno.emAtencao ? "bg-red-500/5" : ""}
              >
                <td
                  className={`sticky left-0 z-10 border border-zinc-700 p-2 font-medium ${
                    aluno.emAtencao
                      ? "bg-red-500/10 text-red-400"
                      : "bg-zinc-900 text-zinc-100"
                  }`}
                >
                  {aluno.nome}
                </td>

                {aluno.disciplinas.map((disciplina) => (
                  <td
                    key={disciplina.disciplinaId}
                    className="border border-zinc-700 p-2 text-center"
                    title={disciplina.disciplinaNome}
                  >
                    <div
                      className={`rounded-lg px-2 py-1 font-bold ${getClasseNota(
                        disciplina.nota
                      )}`}
                    >
                      {disciplina.nota ?? "-"}
                    </div>
                  </td>
                ))}

                <td className="border border-zinc-700 p-2 text-center">
                  <div
                    className={`rounded-lg px-2 py-1 text-base font-bold ${getClasseNota(
                      aluno.media
                    )}`}
                  >
                    {aluno.media !== null ? aluno.media.toFixed(1) : "-"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Legenda cor="bg-red-500" texto="1-4 Abaixo do Básico" />
        <Legenda cor="bg-yellow-500" texto="5-6 Básico" />
        <Legenda cor="bg-green-500" texto="7-8 Adequado" />
        <Legenda cor="bg-blue-500" texto="9-10 Avançado" />
      </div>

      <div className="mt-4 rounded-xl border border-zinc-700 p-4">
        <p className="font-bold text-zinc-300">
          Legenda das disciplinas da turma {turmaAtual.turmaNome}:
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {turmaAtual.disciplinas.map((disciplina) => (
            <span
              key={disciplina.id}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-300"
            >
              <strong>{disciplina.codigo.replace("C", "")}:</strong>{" "}
              {disciplina.nome}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2">
      <div className={`h-4 w-4 rounded ${cor}`} />
      <span className="text-sm font-bold text-zinc-300">{texto}</span>
    </div>
  );
}