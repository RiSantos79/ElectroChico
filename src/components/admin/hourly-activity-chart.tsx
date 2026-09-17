"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_LEGEND, CHART_TOOLTIP, GRAFANA_COLORS } from "./chart-theme";

export function HourlyActivityChart({ data }: { data: { hour: number; visits: number; salesCount: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: `${String(d.hour).padStart(2, "0")}h` }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={formatted}>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="label" {...CHART_AXIS} interval={1} />
        <YAxis {...CHART_AXIS} allowDecimals={false} />
        <Tooltip {...CHART_TOOLTIP} />
        <Legend {...CHART_LEGEND} />
        <Line type="monotone" dataKey="visits" name="Visitas" stroke={GRAFANA_COLORS[1]} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="salesCount" name="Encomendas" stroke={GRAFANA_COLORS[5]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
