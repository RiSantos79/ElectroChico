"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/format";
import { AREA_GRADIENT_STOPS, CHART_AXIS, CHART_GRID, CHART_TOOLTIP, GRAFANA_COLORS } from "./chart-theme";

const COLOR = GRAFANA_COLORS[3];

export function AvgTicketChart({ data }: { data: { date: string; averageTicket: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-avg-ticket" x1="0" y1="0" x2="0" y2="1">
            {AREA_GRADIENT_STOPS.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={COLOR} stopOpacity={s.opacity} />
            ))}
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="label" {...CHART_AXIS} interval={2} />
        <YAxis {...CHART_AXIS} width={44} />
        <Tooltip {...CHART_TOOLTIP} formatter={(value) => formatPrice(Number(value))} />
        <Area
          type="monotone"
          dataKey="averageTicket"
          name="Ticket médio"
          stroke={COLOR}
          strokeWidth={1.5}
          fill="url(#grad-avg-ticket)"
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
