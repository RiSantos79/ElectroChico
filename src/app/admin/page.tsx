import Link from "next/link";
import { redirect } from "next/navigation";
import { getBrands, getCategoriesAdmin, getDashboardSummary, type OrderStatus } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { PERIOD_OPTIONS, resolvePeriod, type PeriodPreset } from "@/lib/dashboard-periods";
import { SalesBarChart } from "@/components/admin/sales-bar-chart";
import { AvgTicketChart } from "@/components/admin/avg-ticket-chart";
import { OrdersCountChart } from "@/components/admin/orders-count-chart";
import { HourlyActivityChart } from "@/components/admin/hourly-activity-chart";
import { WeekdayChart } from "@/components/admin/weekday-chart";
import { TopBarChart } from "@/components/admin/top-bar-chart";
import { DonutChart } from "@/components/admin/donut-chart";
import { NewCustomersChart } from "@/components/admin/new-customers-chart";
import { PortugalChoropleth } from "@/components/admin/portugal-choropleth";

export const metadata = { title: "Dashboard — Backoffice" };

const paymentMethodLabels: Record<string, string> = {
  card: "Cartão",
  multibanco: "Multibanco",
  mb_way: "MB WAY",
  paypal: "PayPal",
};

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Pago" },
  { value: "PROCESSING", label: "Em preparação" },
  { value: "SHIPPED", label: "Expedido" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "REFUNDED", label: "Reembolsado" },
  { value: "FAILED", label: "Falhado" },
];
const statusLabel: Record<string, string> = Object.fromEntries(statusOptions.map((o) => [o.value, o.label]));

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
  danger,
}: {
  title: string;
  value: string;
  current?: number;
  previous?: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${danger ? "text-danger" : "text-foreground"}`}>{value}</p>
      {current !== undefined && previous !== undefined && (
        <div className="mt-1">
          <VariationBadge current={current} previous={previous} />
        </div>
      )}
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col rounded-xl border border-border bg-surface-raised p-4 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </div>
  );
}

type DashboardSearchParams = {
  periodo?: string;
  from?: string;
  to?: string;
  status?: string;
  categoria?: string;
  marca?: string;
  canal?: string;
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const sp = await searchParams;
  const preset = (sp.periodo as PeriodPreset) || "30dias";
  const { from, to } = resolvePeriod(preset, sp.from, sp.to);
  const status = (sp.status as OrderStatus) || undefined;
  const categoryId = sp.categoria || undefined;
  const brandId = sp.marca || undefined;
  const channel = (sp.canal as "online" | "pickup") || undefined;

  const [summary, categories, brands] = await Promise.all([
    getDashboardSummary(token, { from, to, status, categoryId, brandId, channel }),
    getCategoriesAdmin(),
    getBrands(),
  ]);

  // Dias anteriores ao início do tracking não tiveram "zero visitas" — não
  // há dados nenhuns, e convém dizê-lo em vez de deixar ler um zero.
  const visitsIncomplete =
    summary.meta.firstPageViewAt !== null && new Date(from) < new Date(summary.meta.firstPageViewAt);

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Link
          href={`/admin/export?${new URLSearchParams(
            Object.fromEntries(Object.entries(sp).filter(([, v]) => v !== undefined)) as Record<string, string>,
          ).toString()}`}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
        >
          Exportar CSV
        </Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-border bg-surface-raised p-4 sm:grid-cols-3 lg:grid-cols-6">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Período
          <select name="periodo" defaultValue={preset} className="input-field">
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          De (se personalizado)
          <input type="date" name="from" defaultValue={sp.from} className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Até (se personalizado)
          <input type="date" name="to" defaultValue={sp.to} className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Estado da encomenda
          <select name="status" defaultValue={sp.status ?? ""} className="input-field">
            <option value="">Todos (vendas confirmadas)</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Categoria
          <select name="categoria" defaultValue={sp.categoria ?? ""} className="input-field">
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Marca
          <select name="marca" defaultValue={sp.marca ?? ""} className="input-field">
            <option value="">Todas</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-3 lg:col-span-2">
          Canal de venda
          <select name="canal" defaultValue={sp.canal ?? ""} className="input-field">
            <option value="">Todos</option>
            <option value="online">Loja online</option>
            <option value="pickup">Levantamento em loja</option>
          </select>
        </label>
        <button
          type="submit"
          className="self-end rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:col-span-3 sm:w-fit lg:col-span-1"
        >
          Filtrar
        </button>
      </form>

      {/* O que está a ser contado, em texto — evita ler números fora de
          contexto e comparar com listas que mostram tudo. */}
      <div className="rounded-xl border border-border bg-surface px-4 py-3 text-xs text-muted">
        <p>
          A mostrar{" "}
          <span className="font-medium text-foreground">
            {status ? `encomendas no estado "${statusLabel[status]}"` : "vendas confirmadas"}
          </span>{" "}
          {!status && <>(Paga, A preparar, Enviada, Entregue) </>}
          entre{" "}
          <span className="font-medium text-foreground">{new Date(from).toLocaleDateString("pt-PT")}</span> e{" "}
          <span className="font-medium text-foreground">{new Date(to).toLocaleDateString("pt-PT")}</span>, por{" "}
          <span className="font-medium text-foreground">
            {summary.meta.dateField === "paidAt" ? "data de pagamento" : "data da encomenda"}
          </span>
          . Encomendas por pagar não contam como receita — por isso o total aqui é menor do que a lista de
          Encomendas.
        </p>
        {visitsIncomplete && (
          <p className="mt-1 text-amber-500">
            O registo de visitas só começou a{" "}
            {new Date(summary.meta.firstPageViewAt as string).toLocaleDateString("pt-PT")} — dias anteriores
            aparecem com zero visitas por falta de dados, o que também afeta a taxa de conversão.
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Indicadores do período</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Receita total"
            value={formatPrice(summary.period.total)}
            current={summary.period.total}
            previous={summary.previousPeriod.total}
          />
          <MetricCard
            title="Nº de encomendas"
            value={String(summary.period.count)}
            current={summary.period.count}
            previous={summary.previousPeriod.count}
          />
          <MetricCard
            title="Ticket médio"
            value={formatPrice(summary.period.averageTicket)}
            current={summary.period.averageTicket}
            previous={summary.previousPeriod.averageTicket}
          />
          <MetricCard title="Nº de clientes" value={String(summary.distinctCustomers)} />
          <MetricCard title="Novos clientes" value={String(summary.newCustomers)} />
          <MetricCard title="Produtos vendidos" value={String(summary.productsSold)} />
          <MetricCard
            title="Taxa de conversão"
            value={summary.conversionRate !== null ? `${summary.conversionRate.toFixed(1)}%` : "—"}
          />
          <MetricCard title="Carrinhos abandonados" value={String(summary.abandonedCarts)} />
          <MetricCard
            title="Produtos sem stock"
            value={String(summary.stock.outOfStock)}
            danger={summary.stock.outOfStock > 0}
          />
          <MetricCard title="Produtos com stock crítico" value={String(summary.stock.critical)} />
        </div>
      </section>

      <Panel title="Evolução das vendas">
        <SalesBarChart data={summary.dailyStats} />
      </Panel>

      {/* Mapa numa coluna vertical própria, a acompanhar a altura das três
          linhas de gráficos à direita — Portugal é duas vezes mais alto do
          que largo, por isso desperdiça menos espaço assim. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Encomendas por concelho" className="lg:row-span-3">
          <PortugalChoropleth cities={summary.topCities} />
        </Panel>

        <Panel title="Evolução dos clientes">
          <NewCustomersChart data={summary.newCustomersOverTime} />
        </Panel>
        <Panel title="Atividade por hora do dia">
          <HourlyActivityChart data={summary.hourlyActivity} />
        </Panel>

        <Panel title="Vendas por dia da semana">
          <WeekdayChart data={summary.salesByWeekday} />
        </Panel>
        <Panel title="Distribuição de estados das encomendas">
          <DonutChart data={summary.ordersByStatus.map((s) => ({ name: statusLabel[s.status] ?? s.status, value: s.count }))} />
        </Panel>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Evolução das encomendas">
          <OrdersCountChart data={summary.dailyStats} />
        </Panel>
        <Panel title="Evolução do ticket médio">
          <AvgTicketChart data={summary.dailyStats} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Método de pagamento">
          <DonutChart
            data={summary.paymentMethods.map((p) => ({
              name: paymentMethodLabels[p.method] ?? p.method,
              value: p.count,
            }))}
          />
        </Panel>
        <Panel title="Categorias mais vendidas">
          <DonutChart data={summary.revenueByCategory.map((c) => ({ name: c.category, value: c.total }))} variant="currency" />
        </Panel>
        <Panel title="Marcas mais vendidas">
          <DonutChart data={summary.revenueByBrand.map((b) => ({ name: b.brand, value: b.total }))} variant="currency" />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Outros indicadores">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">Clientes recorrentes (2+ compras)</span>
              <span className="font-medium text-foreground">{summary.recurringCustomers}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Clientes de compra única</span>
              <span className="font-medium text-foreground">{summary.loyalty.oneTime}</span>
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
