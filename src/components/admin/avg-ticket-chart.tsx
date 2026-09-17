"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/format";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP, GRAFANA_COLORS } from "./chart-theme";

export function AvgTicketChart({ data }: { data: { date: string; averageTicket: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted}>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="label" {...CHART_AXIS} interval={2} />
        <YAxis {...CHART_AXIS} />
        <Tooltip {...CHART_TOOLTIP} formatter={(value) => formatPrice(Number(value))} />
        <Line type="monotone" dataKey="averageTicket" name="Ticket médio" stroke={GRAFANA_COLORS[0]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
