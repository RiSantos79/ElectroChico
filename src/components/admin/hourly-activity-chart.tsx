"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AREA_GRADIENT_STOPS, CHART_AXIS, CHART_GRID, CHART_LEGEND, CHART_TOOLTIP, SERIES } from "./chart-theme";

const VISITS = SERIES.visitas;
const ORDERS = SERIES.encomendas;

export function HourlyActivityChart({ data }: { data: { hour: number; visits: number; salesCount: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: `${String(d.hour).padStart(2, "0")}h` }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-visits" x1="0" y1="0" x2="0" y2="1">
            {AREA_GRADIENT_STOPS.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={VISITS} stopOpacity={s.opacity} />
            ))}
          </linearGradient>
          <linearGradient id="grad-hour-orders" x1="0" y1="0" x2="0" y2="1">
            {AREA_GRADIENT_STOPS.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={ORDERS} stopOpacity={s.opacity} />
            ))}
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="label" {...CHART_AXIS} interval={3} />
        <YAxis {...CHART_AXIS} allowDecimals={false} width={32} />
        <Tooltip {...CHART_TOOLTIP} />
        <Legend {...CHART_LEGEND} />
        <Area
          type="monotone"
          dataKey="visits"
          name="Visitas"
          stroke={VISITS}
          strokeWidth={1.5}
          fill="url(#grad-visits)"
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="salesCount"
          name="Encomendas"
          stroke={ORDERS}
          strokeWidth={1.5}
          fill="url(#grad-hour-orders)"
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
