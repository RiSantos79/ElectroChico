"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/format";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP, GRAFANA_COLORS } from "./chart-theme";

// `variant` em vez de receber uma função de formatação por prop — Server
// Components não podem passar funções a Client Components.
export function TopBarChart({
  data,
  variant,
}: {
  data: { label: string; value: number }[];
  variant: "currency" | "quantity";
}) {
  if (data.length === 0) return <p className="text-sm text-muted">Sem dados suficientes.</p>;

  const format = (value: number) => (variant === "currency" ? formatPrice(value) : `${value} un.`);

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24 }}>
        <CartesianGrid {...CHART_GRID} vertical horizontal={false} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" width={170} {...CHART_AXIS} />
        <Tooltip {...CHART_TOOLTIP} formatter={(value) => format(Number(value))} />
        <Bar dataKey="value" fill={GRAFANA_COLORS[5]} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
