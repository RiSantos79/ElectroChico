"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/format";
import { CHART_AXIS, CHART_GRID, CHART_LEGEND, CHART_TOOLTIP, SERIES } from "./chart-theme";

// Vendas diárias (barras) sobrepostas às visitas ao site (linha, eixo à
// direita) — mostra volume de negócio e tráfego lado a lado.
export function SalesBarChart({ data }: { data: { date: string; total: number; visits: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={formatted}>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="label" {...CHART_AXIS} interval={2} />
        <YAxis yAxisId="left" {...CHART_AXIS} width={44} />
        <YAxis yAxisId="right" orientation="right" {...CHART_AXIS} allowDecimals={false} width={32} />
        <Tooltip {...CHART_TOOLTIP} formatter={(value, name) => (name === "Vendas" ? formatPrice(Number(value)) : value)} />
        <Legend {...CHART_LEGEND} />
        <Bar yAxisId="left" dataKey="total" name="Vendas" fill={SERIES.vendas} radius={[2, 2, 0, 0]} maxBarSize={22} />
        <Line yAxisId="right" type="monotone" dataKey="visits" name="Visitas" stroke={SERIES.visitas} strokeWidth={1.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
