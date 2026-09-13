import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardSummary } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { SalesBarChart } from "@/components/admin/sales-bar-chart";

export const metadata = { title: "Dashboard — Backoffice" };

function variation(current: number, previous: number): { pct: number | null; up: boolean } {
  if (previous === 0) return { pct: current > 0 ? 100 : null, up: current >= previous };
  const pct = ((current - previous) / previous) * 100;
  return { pct, up: pct >= 0 };
}

function VariationBadge({ current, previous }: { current: number; previous: number }) {
  const { pct, up } = variation(current, previous);
  if (pct === null) return null;
  return (
    <span className={`text-xs font-medium ${up ? "text-success" : "text-danger"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% vs. período anterior
    </span>
  );
}

function MetricCard({
  title,
  value,
  current,
  previous,
}: {
  title: string;
  value: string;
  current?: number;
  previous?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {current !== undefined && previous !== undefined && (
        <div className="mt-1">
          <VariationBadge current={current} previous={previous} />
        </div>
      )}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const summary = await getDashboardSummary(token);

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Vendas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Hoje"
            value={formatPrice(summary.sales.today.total)}
            current={summary.sales.today.total}
            previous={summary.sales.prevDay.total}
          />
          <MetricCard
            title="Este mês"
            value={formatPrice(summary.sales.month.total)}
            current={summary.sales.month.total}
            previous={summary.sales.prevMonth.total}
          />
          <MetricCard
            title="Este ano"
            value={formatPrice(summary.sales.year.total)}
            current={summary.sales.year.total}
            previous={summary.sales.prevYear.total}
          />
          <MetricCard title="Encomendas (mês)" value={String(summary.sales.month.count)} />
          <MetricCard title="Ticket médio (mês)" value={formatPrice(summary.sales.month.averageTicket)} />
          <MetricCard title="Clientes novos (mês)" value={String(summary.newCustomersThisMonth)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Vendas nos últimos 30 dias</h2>
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <SalesBarChart data={summary.dailySales} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Produtos mais vendidos</h2>
          {summary.topProducts.length === 0 ? (
            <p className="text-sm text-muted">Ainda sem vendas.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.topProducts.map((p) => (
                <li key={p.productId} className="flex justify-between">
                  <span className="text-foreground">{p.productName}</span>
                  <span className="text-muted">{p.quantity} un.</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Alertas</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">Clientes recorrentes</span>
              <span className="font-medium text-foreground">{summary.recurringCustomers}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Carrinhos abandonados (+1h sem pagar)</span>
              <span className="font-medium text-foreground">{summary.abandonedCarts}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Produtos sem stock</span>
              <span className={`font-medium ${summary.stock.outOfStock > 0 ? "text-danger" : "text-foreground"}`}>
                {summary.stock.outOfStock}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Produtos com stock crítico</span>
              <span className="font-medium text-foreground">{summary.stock.critical}</span>
            </li>
          </ul>
          {summary.stock.criticalList.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              {summary.stock.criticalList.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <Link href={`/admin/produtos/${p.id}/editar`} className="text-accent hover:underline">
                    {p.name}
                  </Link>
                  <span className="text-muted">{p.stockQuantity} un.</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Taxa de conversão: não disponível — requer analítica de visitas, ainda não implementada.
          </p>
        </div>
      </section>
    </div>
  );
}
