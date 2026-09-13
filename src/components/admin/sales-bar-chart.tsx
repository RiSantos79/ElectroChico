"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/format";

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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={2} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip formatter={(value, name) => (name === "Vendas" ? formatPrice(Number(value)) : value)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="total" name="Vendas" fill="#2563eb" radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="visits" name="Visitas" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
