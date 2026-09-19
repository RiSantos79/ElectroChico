"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPrice } from "@/lib/format";
import { CHART_LEGEND, CHART_TOOLTIP, CHART_COLORS } from "./chart-theme";

// `variant` em vez de receber uma função de formatação por prop — Server
// Components não podem passar funções a Client Components.
export function DonutChart({
  data,
  variant = "count",
  height = 220,
}: {
  data: { name: string; value: number }[];
  variant?: "currency" | "count";
  height?: number;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <p className="text-sm text-muted">Sem dados suficientes.</p>;
  }

  const format = (value: number) => (variant === "currency" ? formatPrice(value) : String(value));
  // Deixa espaço para a legenda por baixo e escala o anel com o painel.
  const ringOuter = Math.max(60, Math.min(140, (height - 70) / 2));
  const ringInner = Math.round(ringOuter * 0.62);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={ringInner} outerRadius={ringOuter} paddingAngle={2} stroke="none">
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...CHART_TOOLTIP} formatter={(value) => format(Number(value))} />
        <Legend {...CHART_LEGEND} />
      </PieChart>
    </ResponsiveContainer>
  );
}
