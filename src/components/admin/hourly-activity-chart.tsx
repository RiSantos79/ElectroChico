"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function HourlyActivityChart({ data }: { data: { hour: number; visits: number; salesCount: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: `${String(d.hour).padStart(2, "0")}h` }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="visits" name="Visitas" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="salesCount" name="Encomendas" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
