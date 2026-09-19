"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/format";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP, SERIES } from "./chart-theme";

export function WeekdayChart({ data }: { data: { weekday: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="weekday" {...CHART_AXIS} />
        <YAxis {...CHART_AXIS} width={44} />
        <Tooltip {...CHART_TOOLTIP} formatter={(value) => formatPrice(Number(value))} />
        <Bar dataKey="total" name="Vendas" fill={SERIES.vendas} radius={[2, 2, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}
