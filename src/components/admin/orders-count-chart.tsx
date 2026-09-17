"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP, GRAFANA_COLORS } from "./chart-theme";

export function OrdersCountChart({ data }: { data: { date: string; count: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted}>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="label" {...CHART_AXIS} interval={2} />
        <YAxis {...CHART_AXIS} allowDecimals={false} />
        <Tooltip {...CHART_TOOLTIP} />
        <Line type="monotone" dataKey="count" name="Encomendas" stroke={GRAFANA_COLORS[2]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
