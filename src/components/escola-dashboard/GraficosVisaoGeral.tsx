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
import { useCurrentTheme } from "../../hooks/useCurrentTheme";

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
  critico: "#E0524A",
  basico: "#F2B705",
  adequado: "#1F9D8C",
  avancado: "#1565D8",
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "var(--shadow-card)",
  padding: "var(--space-4)",
};

export default function GraficosVisaoGeral({
  distribuicaoPorTurma,
  distribuicaoGeral,
}: Props) {
  const theme = useCurrentTheme();

  const c = theme === "dark"
    ? {
        grid: "#2A2F3A",
        axis: "#8A909E",
        tick: "#E1E4EA",
        tooltipBg: "#1E2229",
        tooltipBorder: "#2A2F3A",
        tooltipText: "#E1E4EA",
      }
    : {
        grid: "#E3E6EA",
        axis: "#7A8089",
        tick: "#2B2F36",
        tooltipBg: "#FFFFFF",
        tooltipBorder: "#E3E6EA",
        tooltipText: "#2B2F36",
      };

  const pizza = [
    { name: "Crítico", value: distribuicaoGeral.critico, color: cores.critico },
    { name: "Básico", value: distribuicaoGeral.basico, color: cores.basico },
    { name: "Adequado", value: distribuicaoGeral.adequado, color: cores.adequado },
    { name: "Avançado", value: distribuicaoGeral.avancado, color: cores.avancado },
  ];

  const total =
    distribuicaoGeral.critico +
    distribuicaoGeral.basico +
    distribuicaoGeral.adequado +
    distribuicaoGeral.avancado;

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div style={cardStyle}>
        <div className="mb-3 inline-flex px-3 py-1 text-xs font-medium"
          style={{
            background: "var(--bg-app)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-pill)",
            color: "var(--text-secondary)",
          }}
        >
          Indicadores por turma
        </div>

        <h2 className="text-lg tracking-tight" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
          Distribuição Pedagógica por Turma
        </h2>

        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Quantidade de alunos em cada nível pedagógico
        </p>

        <div className="mt-6 h-[380px] md:h-[430px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={distribuicaoPorTurma}
              margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />

              <XAxis
                dataKey="turma"
                stroke={c.axis}
                tick={{ fontSize: 11, fill: c.tick, fontWeight: 600 }}
                angle={-25}
                textAnchor="end"
                height={60}
                interval={0}
              />

              <YAxis stroke={c.axis} tick={{ fill: c.axis }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: c.tooltipBg,
                  border: `1px solid ${c.tooltipBorder}`,
                  borderRadius: "6px",
                  color: c.tooltipText,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />

              <Bar dataKey="critico" stackId="a" fill={cores.critico} radius={[0, 0, 0, 0]}>
                <LabelList dataKey="critico" position="center" fill="#fff" fontWeight={600} />
              </Bar>

              <Bar dataKey="basico" stackId="a" fill={cores.basico}>
                <LabelList dataKey="basico" position="center" fill="#2B2F36" fontWeight={600} />
              </Bar>

              <Bar dataKey="adequado" stackId="a" fill={cores.adequado}>
                <LabelList dataKey="adequado" position="center" fill="#fff" fontWeight={600} />
              </Bar>

              <Bar dataKey="avancado" stackId="a" fill={cores.avancado} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="avancado" position="center" fill="#fff" fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Legenda total={total} dados={pizza} />
      </div>

      <div style={cardStyle}>
        <div className="mb-3 inline-flex px-3 py-1 text-xs font-medium"
          style={{
            background: "var(--bg-app)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-pill)",
            color: "var(--text-secondary)",
          }}
        >
          Panorama geral
        </div>

        <h2 className="text-lg tracking-tight" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
          Visão Geral da Escola
        </h2>

        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Total de {total} alunos por nível pedagógico
        </p>

        <div className="mt-6 h-[380px] md:h-[430px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: c.tooltipBg,
                  border: `1px solid ${c.tooltipBorder}`,
                  borderRadius: "6px",
                  color: c.tooltipText,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {dados.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-2 px-3 py-1.5"
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-pill)",
            background: "var(--bg-app)",
          }}
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            {item.name}
          </span>
          <span className="text-xs font-semibold" style={{ color: item.color }}>
            {item.value}
          </span>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
          </span>
        </div>
      ))}
    </div>
  );
}