"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPrice } from "@/lib/format";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#0891b2", "#db2777", "#65a30d"];

// `variant` em vez de receber uma função de formatação por prop — Server
// Components não podem passar funções a Client Components.
export function DonutChart({
  data,
  variant = "count",
}: {
  data: { name: string; value: number }[];
  variant?: "currency" | "count";
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <p className="text-sm text-muted">Sem dados suficientes.</p>;
  }

  const format = (value: number) => (variant === "currency" ? formatPrice(value) : String(value));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => format(Number(value))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
