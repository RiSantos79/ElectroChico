"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/format";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP, SERIES } from "./chart-theme";

// `variant` em vez de receber uma função de formatação por prop — Server
// Components não podem passar funções a Client Components.
function truncate(label: string): string {
  return label.length > 20 ? `${label.slice(0, 19)}…` : label;
}

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
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid {...CHART_GRID} vertical horizontal={false} />
        <XAxis type="number" hide />
        {/* Em três colunas o painel é estreito: um eixo largo com nomes
            inteiros não deixava espaço para as barras. */}
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tickFormatter={truncate}
          {...CHART_AXIS}
        />
        <Tooltip {...CHART_TOOLTIP} formatter={(value) => format(Number(value))} labelFormatter={(label) => String(label)} />
        <Bar dataKey="value" fill={SERIES.vendas} radius={[0, 2, 2, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
