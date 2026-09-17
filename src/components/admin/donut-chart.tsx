"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPrice } from "@/lib/format";
import { CHART_LEGEND, CHART_TOOLTIP, GRAFANA_COLORS } from "./chart-theme";

// `variant` em vez de receber uma função de formatação por prop — Server
// Components não podem passar funções a Client Components.
export function DonutChart({
  data,
  variant = "count",
}: {
  data: { name: string; value: number }[];
  variant?: "currency" | "count";
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <p className="text-sm text-muted">Sem dados suficientes.</p>;
  }

  const format = (value: number) => (variant === "currency" ? formatPrice(value) : String(value));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none">
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={GRAFANA_COLORS[i % GRAFANA_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...CHART_TOOLTIP} formatter={(value) => format(Number(value))} />
        <Legend {...CHART_LEGEND} />
      </PieChart>
    </ResponsiveContainer>
  );
}
