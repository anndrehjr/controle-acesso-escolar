"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";

type DistribuicaoTurma = {
  turma: string;
  critico: number;
  basico: number;
  adequado: number;
  avancado: number;
};

type DistribuicaoGeral = {
  critico: number;
  basico: number;
  adequado: number;
  avancado: number;
};

type Props = {
  distribuicaoPorTurma: DistribuicaoTurma[];
  distribuicaoGeral: DistribuicaoGeral;
};

const cores = {
  critico: "#ef4444",
  basico: "#eab308",
  adequado: "#22c55e",
  avancado: "#3b82f6",
};

export default function GraficosVisaoGeral({
  distribuicaoPorTurma,
  distribuicaoGeral,
}: Props) {
  const pizza = [
    {
      name: "Crítico",
      value: distribuicaoGeral.critico,
      color: cores.critico,
    },
    {
      name: "Básico",
      value: distribuicaoGeral.basico,
      color: cores.basico,
    },
    {
      name: "Adequado",
      value: distribuicaoGeral.adequado,
      color: cores.adequado,
    },
    {
      name: "Avançado",
      value: distribuicaoGeral.avancado,
      color: cores.avancado,
    },
  ];

  const total =
    distribuicaoGeral.critico +
    distribuicaoGeral.basico +
    distribuicaoGeral.adequado +
    distribuicaoGeral.avancado;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold">
          Distribuição Pedagógica por Turma
        </h2>

        <p className="text-zinc-400 mt-1">
          Quantidade de alunos em cada nível pedagógico
        </p>

        <div className="mt-6 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribuicaoPorTurma}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

              <XAxis
                dataKey="turma"
                stroke="#a1a1aa"
                tick={{ fontSize: 12 }}
              />

              <YAxis stroke="#a1a1aa" />

              <Bar dataKey="critico" stackId="a" fill={cores.critico}>
                <LabelList dataKey="critico" position="center" fill="#fff" />
              </Bar>

              <Bar dataKey="basico" stackId="a" fill={cores.basico}>
                <LabelList dataKey="basico" position="center" fill="#000" />
              </Bar>

              <Bar dataKey="adequado" stackId="a" fill={cores.adequado}>
                <LabelList dataKey="adequado" position="center" fill="#000" />
              </Bar>

              <Bar dataKey="avancado" stackId="a" fill={cores.avancado}>
                <LabelList dataKey="avancado" position="center" fill="#fff" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Legenda total={total} dados={pizza} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold">
          Visão Geral da Escola
        </h2>

        <p className="text-zinc-400 mt-1">
          Total de {total} alunos por nível pedagógico
        </p>

        <div className="mt-6 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pizza}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ value, percent }) =>
                  `${value} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
              >
                {pizza.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <Legenda total={total} dados={pizza} />
      </div>
    </section>
  );
}

function Legenda({
  dados,
  total,
}: {
  dados: { name: string; value: number; color: string }[];
  total: number;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-3 justify-center">
      {dados.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-2 border border-zinc-700 rounded-xl px-4 py-2"
        >
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: item.color }}
          />

          <span className="font-bold">{item.name}</span>

          <span style={{ color: item.color }} className="font-bold">
            {item.value}
          </span>

          <span className="text-zinc-400">
            ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
          </span>
        </div>
      ))}
    </div>
  );
}