import { formatPrice } from "@/lib/format";

// Gráfico de barras simples com divs — o volume de dados (30 pontos) não
// justifica adicionar uma biblioteca de gráficos só para isto.
export function SalesBarChart({ data }: { data: { date: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex h-40 gap-1">
      {data.map((d) => (
        <div key={d.date} className="group relative flex flex-1 flex-col justify-end">
          <div
            className="rounded-t bg-accent transition-opacity group-hover:opacity-80"
            style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total > 0 ? "2px" : 0 }}
          />
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background opacity-0 group-hover:opacity-100">
            {new Date(d.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })} —{" "}
            {formatPrice(d.total)}
          </div>
        </div>
      ))}
    </div>
  );
}
