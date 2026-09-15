import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardSummary } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { coordsForCity } from "@/lib/pt-cities";
import { SalesBarChart } from "@/components/admin/sales-bar-chart";
import { AvgTicketChart } from "@/components/admin/avg-ticket-chart";
import { HourlyActivityChart } from "@/components/admin/hourly-activity-chart";
import { WeekdayChart } from "@/components/admin/weekday-chart";
import { TopBarChart } from "@/components/admin/top-bar-chart";
import { DonutChart } from "@/components/admin/donut-chart";
import { NewCustomersChart } from "@/components/admin/new-customers-chart";
import { CitiesMapLoader } from "@/components/admin/cities-map-loader";

export const metadata = { title: "Dashboard — Backoffice" };

const paymentMethodLabels: Record<string, string> = {
  card: "Cartão",
  multibanco: "Multibanco",
  mb_way: "MB WAY",
  paypal: "PayPal",
};

function formatResponseTime(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} dias`;
}

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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const summary = await getDashboardSummary(token);

  const unmatchedCities = summary.topCities.filter((c) => !coordsForCity(c.city));

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {summary.securityAlerts.length > 0 && (
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-500">
            Alertas de segurança — últimos 7 dias
          </h2>
          <ul className="divide-y divide-amber-500/20">
            {summary.securityAlerts.map((alert, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-foreground">{alert.message}</span>
                <span className="shrink-0 text-xs text-muted">
                  {alert.actor && <>{alert.actor} — </>}
                  {new Date(alert.createdAt).toLocaleString("pt-PT")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <Panel title="Vendas e visitas — últimos 30 dias">
        <SalesBarChart data={summary.dailyStats} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Ticket médio — últimos 30 dias">
          <AvgTicketChart data={summary.dailyStats} />
        </Panel>
        <Panel title="Atividade por hora do dia — últimos 30 dias">
          <HourlyActivityChart data={summary.hourlyActivity} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Vendas por dia da semana — últimos 90 dias">
          <WeekdayChart data={summary.salesByWeekday} />
        </Panel>
        <Panel title="Novos clientes — últimos 90 dias">
          <NewCustomersChart data={summary.newCustomersOverTime} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Produtos mais vendidos (top 10)">
          <TopBarChart
            data={summary.topProducts.map((p) => ({ label: p.productName, value: p.quantity }))}
            variant="quantity"
          />
        </Panel>
        <Panel title="Clientes com mais compras (top 10)">
          <TopBarChart
            data={summary.topCustomers.map((c) => ({ label: c.name || c.email, value: c.total }))}
            variant="currency"
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Receita por categoria">
          <DonutChart
            data={summary.revenueByCategory.map((c) => ({ name: c.category, value: c.total }))}
            variant="currency"
          />
        </Panel>
        <Panel title="Clientes novos vs. recorrentes">
          <DonutChart
            data={[
              { name: "Novos (1 compra)", value: summary.loyalty.oneTime },
              { name: "Recorrentes (2+)", value: summary.loyalty.recurring },
            ]}
          />
        </Panel>
        <Panel title="Método de pagamento">
          <DonutChart
            data={summary.paymentMethods.map((p) => ({
              name: paymentMethodLabels[p.method] ?? p.method,
              value: p.count,
            }))}
          />
        </Panel>
      </div>

      <Panel title="Clientes por cidade">
        <CitiesMapLoader cities={summary.topCities} />
        {unmatchedCities.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Sem coordenadas no mapa: {unmatchedCities.map((c) => `${c.city} (${c.orderCount})`).join(", ")}
          </p>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Alertas">
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
            Taxa de conversão: não disponível — requer analítica de sessões, ainda não implementada.
          </p>
        </Panel>

        <Panel title="Cartões-presente e suporte">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">Cartões-presente ativos</span>
              <span className="font-medium text-foreground">
                {summary.giftCardStats.activeCount} ({formatPrice(summary.giftCardStats.activeValue)})
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Cartões-presente resgatados</span>
              <span className="font-medium text-foreground">
                {summary.giftCardStats.redeemedCount} ({formatPrice(summary.giftCardStats.redeemedValue)})
              </span>
            </li>
            <li className="flex justify-between border-t border-border pt-2">
              <span className="text-muted">Mensagens de suporte</span>
              <span className="font-medium text-foreground">{summary.support.total}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Respondidas</span>
              <span className="font-medium text-foreground">{summary.support.responded}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Tempo médio de resposta</span>
              <span className="font-medium text-foreground">{formatResponseTime(summary.support.avgResponseHours)}</span>
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
