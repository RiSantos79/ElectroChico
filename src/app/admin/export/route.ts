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

// Linha em branco entre secções, em CRLF como o resto do ficheiro CSV.
const SEPARADOR = "\r\n\r\n";

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

  // A API já não devolve o que este utilizador não pode ver, mas exportar
  // "Receita total: 0" seria pior do que omitir a linha: quem lesse o ficheiro
  // concluía que a loja não vendeu nada.
  const v = summary.visible;
  const summaryRows = [
    { indicador: "Período", valor: `${from.slice(0, 10)} a ${to.slice(0, 10)}` },
    { indicador: "Estado filtrado", valor: status ? statusLabel[status] : "Todos (vendas confirmadas)" },
    { indicador: "Categoria filtrada", valor: categoryId ? (categories.find((c) => c.id === categoryId)?.name ?? categoryId) : "Todas" },
    { indicador: "Marca filtrada", valor: brandId ? (brands.find((b) => b.id === brandId)?.name ?? brandId) : "Todas" },
    { indicador: "Canal filtrado", valor: channel === "pickup" ? "Levantamento em loja" : channel === "online" ? "Loja online" : "Todos" },
    ...(v.financeiro
      ? [
          { indicador: "Receita total", valor: summary.period.total },
          { indicador: "Ticket médio", valor: summary.period.averageTicket },
        ]
      : []),
    ...(v.encomendas
      ? [
          { indicador: "Nº de encomendas", valor: summary.period.count },
          { indicador: "Carrinhos abandonados", valor: summary.abandonedCarts },
        ]
      : []),
    ...(v.clientes ? [{ indicador: "Nº de clientes", valor: summary.distinctCustomers }] : []),
    ...(v.trafego
      ? [
          { indicador: "Novos clientes", valor: summary.newCustomers },
          { indicador: "Taxa de conversão (%)", valor: summary.conversionRate ?? "" },
        ]
      : []),
    ...(v.produtos ? [{ indicador: "Produtos vendidos", valor: summary.productsSold }] : []),
    ...(v.stock
      ? [
          { indicador: "Produtos sem stock", valor: summary.stock.outOfStock },
          { indicador: "Produtos com stock crítico", valor: summary.stock.critical },
        ]
      : []),
  ];

  // Cada secção só entra se o utilizador puder ver aquele bloco. As colunas de
  // "Vendas diárias" também variam: sem acesso a receita, o ficheiro leva a
  // contagem de encomendas em vez de colunas de euros a zero.
  type DailyRow = (typeof summary.dailyStats)[number];

  const seccoes = [
    section(
      "RESUMO DO PERÍODO",
      toCsv(summaryRows, [
        { label: "Indicador", value: (r) => r.indicador },
        { label: "Valor", value: (r) => r.valor },
      ]),
    ),
    (v.financeiro || v.encomendas) &&
      section(
        "VENDAS DIÁRIAS",
        toCsv(summary.dailyStats, [
          { label: "Data", value: (r: DailyRow) => r.date },
          ...(v.financeiro
            ? [
                { label: "Total", value: (r: DailyRow) => r.total },
                { label: "Ticket médio", value: (r: DailyRow) => r.averageTicket },
              ]
            : []),
          { label: "Encomendas", value: (r: DailyRow) => r.count },
          ...(v.trafego ? [{ label: "Visitas", value: (r: DailyRow) => r.visits }] : []),
        ]),
      ),
    v.produtos &&
      section(
        "PRODUTOS MAIS VENDIDOS",
        toCsv(summary.topProducts, [
          { label: "Produto", value: (r) => r.productName },
          { label: "Quantidade", value: (r) => r.quantity },
        ]),
      ),
    v.financeiro &&
      section(
        "CATEGORIAS MAIS VENDIDAS",
        toCsv(summary.revenueByCategory, [
          { label: "Categoria", value: (r) => r.category },
          { label: "Receita", value: (r) => r.total },
        ]),
      ),
    v.financeiro &&
      section(
        "MARCAS MAIS VENDIDAS",
        toCsv(summary.revenueByBrand, [
          { label: "Marca", value: (r) => r.brand },
          { label: "Receita", value: (r) => r.total },
        ]),
      ),
    v.encomendas &&
      section(
        "ESTADOS DAS ENCOMENDAS",
        toCsv(summary.ordersByStatus, [
          { label: "Estado", value: (r) => statusLabel[r.status] ?? r.status },
          { label: "Nº de encomendas", value: (r) => r.count },
        ]),
      ),
  ].filter((b): b is string => typeof b === "string");

  const csv = "﻿" + seccoes.join(SEPARADOR);

  return csvResponse(csv, `dashboard-${from.slice(0, 10)}-a-${to.slice(0, 10)}.csv`);
}
