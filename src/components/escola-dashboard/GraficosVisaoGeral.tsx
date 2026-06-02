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
  Tooltip,
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
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
            Indicadores por turma
          </div>

          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            Distribuição Pedagógica por Turma
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-base">
            Quantidade de alunos em cada nível pedagógico
          </p>

          <div className="mt-8 h-[380px] md:h-[430px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribuicaoPorTurma} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

                <XAxis
                  dataKey="turma"
                  stroke="#a1a1aa"
                  tick={{ fontSize: 11, fill: "#d4d4d8", fontWeight: 700 }}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />

                <YAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    border: "1px solid #3f3f46",
                    borderRadius: "16px",
                    color: "#ffffff",
                  }}
                />

                <Bar dataKey="critico" stackId="a" fill={cores.critico} radius={[0, 0, 0, 0]}>
                  <LabelList dataKey="critico" position="center" fill="#fff" fontWeight={800} />
                </Bar>

                <Bar dataKey="basico" stackId="a" fill={cores.basico}>
                  <LabelList dataKey="basico" position="center" fill="#000" fontWeight={800} />
                </Bar>

                <Bar dataKey="adequado" stackId="a" fill={cores.adequado}>
                  <LabelList dataKey="adequado" position="center" fill="#000" fontWeight={800} />
                </Bar>

                <Bar dataKey="avancado" stackId="a" fill={cores.avancado} radius={[8, 8, 0, 0]}>
                  <LabelList dataKey="avancado" position="center" fill="#fff" fontWeight={800} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <Legenda total={total} dados={pizza} />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-white shadow-2xl backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-700/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
            Panorama geral
          </div>

          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            Visão Geral da Escola
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-base">
            Total de {total} alunos por nível pedagógico
          </p>

          <div className="mt-8 h-[380px] md:h-[430px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    border: "1px solid #3f3f46",
                    borderRadius: "16px",
                    color: "#ffffff",
                  }}
                />
                <Pie
                  data={pizza}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={145}
                  innerRadius={70}
                  paddingAngle={3}
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
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      {dados.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-2 shadow-lg"
        >
          <div
            className="h-4 w-4 rounded"
            style={{ backgroundColor: item.color }}
          />

          <span className="font-bold text-zinc-100">{item.name}</span>

          <span style={{ color: item.color }} className="font-black">
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
