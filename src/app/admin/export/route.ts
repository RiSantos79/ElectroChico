import { getBrands, getCategoriesAdmin, getDashboardSummary, type OrderStatus } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { resolvePeriod, type PeriodPreset } from "@/lib/dashboard-periods";
import { toCsv, csvResponse } from "@/lib/csv";

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  PROCESSING: "Em preparação",
  SHIPPED: "Expedido",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
  FAILED: "Falhado",
};

function section(title: string, csv: string): string {
  return `${title}\r\n${csv.replace(/^﻿/, "")}`;
}

export async function GET(request: Request) {
  const token = await getSessionToken();
  if (!token) return new Response("Não autenticado", { status: 401 });

  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
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

  const summaryRows = [
    { indicador: "Período", valor: `${from.slice(0, 10)} a ${to.slice(0, 10)}` },
    { indicador: "Estado filtrado", valor: status ? statusLabel[status] : "Todos (vendas confirmadas)" },
    { indicador: "Categoria filtrada", valor: categoryId ? (categories.find((c) => c.id === categoryId)?.name ?? categoryId) : "Todas" },
    { indicador: "Marca filtrada", valor: brandId ? (brands.find((b) => b.id === brandId)?.name ?? brandId) : "Todas" },
    { indicador: "Canal filtrado", valor: channel === "pickup" ? "Levantamento em loja" : channel === "online" ? "Loja online" : "Todos" },
    { indicador: "Receita total", valor: summary.period.total },
    { indicador: "Nº de encomendas", valor: summary.period.count },
    { indicador: "Ticket médio", valor: summary.period.averageTicket },
    { indicador: "Nº de clientes", valor: summary.distinctCustomers },
    { indicador: "Novos clientes", valor: summary.newCustomers },
    { indicador: "Produtos vendidos", valor: summary.productsSold },
    { indicador: "Taxa de conversão (%)", valor: summary.conversionRate ?? "" },
    { indicador: "Carrinhos abandonados", valor: summary.abandonedCarts },
    { indicador: "Produtos sem stock", valor: summary.stock.outOfStock },
    { indicador: "Produtos com stock crítico", valor: summary.stock.critical },
  ];

  const csv =
    "﻿" +
    [
      section(
        "RESUMO DO PERÍODO",
        toCsv(summaryRows, [
          { label: "Indicador", value: (r) => r.indicador },
          { label: "Valor", value: (r) => r.valor },
        ]),
      ),
      section(
        "VENDAS DIÁRIAS",
        toCsv(summary.dailyStats, [
          { label: "Data", value: (r) => r.date },
          { label: "Total", value: (r) => r.total },
          { label: "Encomendas", value: (r) => r.count },
          { label: "Ticket médio", value: (r) => r.averageTicket },
          { label: "Visitas", value: (r) => r.visits },
        ]),
      ),
      section(
        "PRODUTOS MAIS VENDIDOS",
        toCsv(summary.topProducts, [
          { label: "Produto", value: (r) => r.productName },
          { label: "Quantidade", value: (r) => r.quantity },
        ]),
      ),
      section(
        "CATEGORIAS MAIS VENDIDAS",
        toCsv(summary.revenueByCategory, [
          { label: "Categoria", value: (r) => r.category },
          { label: "Receita", value: (r) => r.total },
        ]),
      ),
      section(
        "MARCAS MAIS VENDIDAS",
        toCsv(summary.revenueByBrand, [
          { label: "Marca", value: (r) => r.brand },
          { label: "Receita", value: (r) => r.total },
        ]),
      ),
      section(
        "ESTADOS DAS ENCOMENDAS",
        toCsv(summary.ordersByStatus, [
          { label: "Estado", value: (r) => statusLabel[r.status] ?? r.status },
          { label: "Nº de encomendas", value: (r) => r.count },
        ]),
      ),
    ].join("\r\n\r\n");

  return csvResponse(csv, `dashboard-${from.slice(0, 10)}-a-${to.slice(0, 10)}.csv`);
}
