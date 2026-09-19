"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AREA_GRADIENT_STOPS, CHART_AXIS, CHART_GRID, CHART_TOOLTIP, SERIES } from "./chart-theme";

const COLOR = SERIES.encomendas;

export function OrdersCountChart({ data }: { data: { date: string; count: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-orders-count" x1="0" y1="0" x2="0" y2="1">
            {AREA_GRADIENT_STOPS.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={COLOR} stopOpacity={s.opacity} />
            ))}
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="label" {...CHART_AXIS} interval={2} />
        <YAxis {...CHART_AXIS} allowDecimals={false} width={32} />
        <Tooltip {...CHART_TOOLTIP} />
        <Area
          type="monotone"
          dataKey="count"
          name="Encomendas"
          stroke={COLOR}
          strokeWidth={1.5}
          fill="url(#grad-orders-count)"
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
