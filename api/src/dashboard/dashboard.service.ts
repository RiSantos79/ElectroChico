import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PAID_LIKE_STATUSES } from '../common/order-status.js';
import { ABANDONED_CART_AFTER_MS } from '../common/abandoned-cart.js';
import type { Prisma, OrderStatus } from '../generated/prisma/client.js';
import type { DashboardFiltersDto } from './dto/dashboard-filters.dto.js';

const STOCK_CRITICAL_THRESHOLD = 5;
const DEFAULT_WINDOW_DAYS = 30;
const PICKUP_PAYMENT_METHOD = 'Levantamento em Loja';

type ResolvedFilters = {
  from: Date;
  to: Date;
  statusList: OrderStatus[];
  /** Campo usado para datar encomendas — ver resolveFilters(). */
  dateField: 'paidAt' | 'createdAt';
  orderWhere: Prisma.OrderWhereInput;
  itemProductFilter?: string[];
  categoryId?: string;
  brandId?: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(filters: DashboardFiltersDto) {
    const resolved = await this.resolveFilters(filters);
    const { from, to, orderWhere, itemProductFilter, dateField } = resolved;
    const periodLengthMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodLengthMs);
    const prevTo = from;
    const prevOrderWhere: Prisma.OrderWhereInput = { ...orderWhere, [dateField]: { gte: prevFrom, lt: prevTo } };

    const [
      period,
      previousPeriod,
      newCustomers,
      distinctCustomers,
      productsSold,
      visits,
      loyalty,
      abandonedCarts,
      stock,
      topProducts,
      topCustomers,
      dailyStats,
      hourlyActivity,
      salesByWeekday,
      revenueByCategory,
      revenueByBrand,
      ordersByStatus,
      newCustomersOverTime,
      topCities,
      giftCardStats,
      paymentMethods,
      support,
      firstPageView,
    ] = await Promise.all([
      this.salesFor(orderWhere),
      this.salesFor(prevOrderWhere),
      this.prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: from, lte: to } } }),
      this.distinctCustomers(orderWhere),
      this.productsSold(orderWhere, itemProductFilter),
      this.prisma.pageView.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.customerLoyalty(orderWhere),
      this.abandonedCartsCount(from, to),
      this.stockAlerts(resolved.categoryId, resolved.brandId),
      this.topProducts(orderWhere, itemProductFilter, 10),
      this.topCustomers(orderWhere, 10),
      this.dailyStats(orderWhere, from, to, dateField),
      this.hourlyActivity(orderWhere, from, to, dateField),
      this.salesByWeekday(orderWhere, dateField),
      this.revenueByCategory(orderWhere, itemProductFilter),
      this.revenueByBrand(orderWhere, itemProductFilter),
      this.ordersByStatus(orderWhere),
      this.newCustomersOverTime(from, to),
      this.topCities(orderWhere, 20),
      this.giftCardStats(),
      this.paymentMethodBreakdown(orderWhere),
      this.supportStats(),
      // Para o dashboard poder avisar que os dias anteriores ao início do
      // registo de tráfego não têm visitas (e não que tiveram zero).
      this.prisma.pageView.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    ]);

    return {
      period,
      previousPeriod,
      newCustomers,
      distinctCustomers,
      productsSold,
      conversionRate: visits > 0 ? (period.count / visits) * 100 : null,
      recurringCustomers: loyalty.recurring,
      loyalty,
      abandonedCarts,
      stock,
      topProducts,
      topCustomers,
      dailyStats,
      hourlyActivity,
      salesByWeekday,
      revenueByCategory,
      revenueByBrand,
      ordersByStatus,
      newCustomersOverTime,
      topCities,
      giftCardStats,
      paymentMethods,
      support,
      meta: {
        dateField,
        statuses: resolved.statusList,
        from,
        to,
        firstPageViewAt: firstPageView?.createdAt ?? null,
      },
    };
  }

  // Junta todos os filtros globais (período, estado, categoria/marca, canal)
  // num único Prisma where reutilizado por todas as métricas ao nível da
  // encomenda — categoria/marca são resolvidas para uma lista de produtos e
  // depois para as encomendas que os contêm, já que OrderItem só guarda o
  // productId em texto (sem relação com Product).
  private async resolveFilters(filters: DashboardFiltersDto): Promise<ResolvedFilters> {
    const to = filters.to ? new Date(filters.to) : new Date();
    const from = filters.from
      ? new Date(filters.from)
      : new Date(to.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const statusList = filters.status ? [filters.status] : PAID_LIKE_STATUSES;

    const channelWhere: Prisma.OrderWhereInput =
      filters.channel === 'pickup'
        ? { paymentMethod: PICKUP_PAYMENT_METHOD }
        : filters.channel === 'online'
          ? { paymentMethod: { not: PICKUP_PAYMENT_METHOD } }
          : {};

    let itemProductFilter: string[] | undefined;
    let orderIdFilter: string[] | undefined;
    if (filters.categoryId || filters.brandId) {
      const products = await this.prisma.product.findMany({
        where: { categoryId: filters.categoryId, brandId: filters.brandId },
        select: { id: true },
      });
      itemProductFilter = products.map((p) => p.id);
      const items = await this.prisma.orderItem.findMany({
        where: { productId: { in: itemProductFilter } },
        select: { orderId: true },
        distinct: ['orderId'],
      });
      orderIdFilter = items.map((i) => i.orderId);
    }

    // Vendas confirmadas contam pela data do pagamento; estados que nunca
    // foram pagos (pendente, cancelada, falhada) não têm paidAt, por isso
    // esses contam pela data em que a encomenda foi feita.
    const onlyPaidLike = statusList.every((s) => PAID_LIKE_STATUSES.includes(s));
    const dateField: 'paidAt' | 'createdAt' = onlyPaidLike ? 'paidAt' : 'createdAt';

    const orderWhere: Prisma.OrderWhereInput = {
      status: { in: statusList },
      [dateField]: { gte: from, lte: to },
      ...channelWhere,
      ...(orderIdFilter ? { id: { in: orderIdFilter } } : {}),
    };

    return {
      from,
      to,
      statusList,
      dateField,
      orderWhere,
      itemProductFilter,
      categoryId: filters.categoryId,
      brandId: filters.brandId,
    };
  }

  private async salesFor(where: Prisma.OrderWhereInput) {
    const result = await this.prisma.order.aggregate({ where, _sum: { total: true }, _count: true });
    const total = Number(result._sum.total ?? 0);
    const count = result._count;
    return { total, count, averageTicket: count > 0 ? total / count : 0 };
  }

  private async distinctCustomers(where: Prisma.OrderWhereInput) {
    const grouped = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { ...where, customerId: { not: null } },
    });
    return grouped.length;
  }

  private async productsSold(where: Prisma.OrderWhereInput, productFilter?: string[]) {
    const result = await this.prisma.orderItem.aggregate({
      where: { order: where, ...(productFilter ? { productId: { in: productFilter } } : {}) },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  private async customerLoyalty(where: Prisma.OrderWhereInput) {
    const grouped = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { ...where, customerId: { not: null } },
      _count: { _all: true },
    });
    const recurring = grouped.filter((g) => g._count._all > 1).length;
    return { recurring, oneTime: grouped.length - recurring };
  }

  // Deliberadamente à parte dos restantes filtros de estado/canal — um
  // carrinho abandonado é sempre PENDING por definição.
  private abandonedCartsCount(from: Date, to: Date) {
    return this.prisma.order.count({
      where: {
        status: 'PENDING',
        createdAt: { gte: from, lte: to, lt: new Date(Date.now() - ABANDONED_CART_AFTER_MS) },
      },
    });
  }

  private async stockAlerts(categoryId?: string, brandId?: string) {
    const where: Prisma.ProductWhereInput = { categoryId, brandId };
    const [outOfStock, critical, criticalList] = await Promise.all([
      this.prisma.product.count({ where: { ...where, stockQuantity: 0 } }),
      this.prisma.product.count({ where: { ...where, stockQuantity: { gt: 0, lte: STOCK_CRITICAL_THRESHOLD } } }),
      this.prisma.product.findMany({
        where: { ...where, stockQuantity: { lte: STOCK_CRITICAL_THRESHOLD } },
        orderBy: { stockQuantity: 'asc' },
        take: 10,
        select: { id: true, name: true, slug: true, stockQuantity: true },
      }),
    ]);
    return { outOfStock, critical, criticalList };
  }

  private async topProducts(where: Prisma.OrderWhereInput, productFilter: string[] | undefined, limit: number) {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: { order: where, ...(productFilter ? { productId: { in: productFilter } } : {}) },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    return grouped.map((g) => ({
      productId: g.productId,
      productName: g.productName,
      quantity: g._sum.quantity ?? 0,
    }));
  }

  private async topCustomers(where: Prisma.OrderWhereInput, limit: number) {
    const grouped = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { ...where, customerId: { not: null } },
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });
    const ids = grouped.map((g) => g.customerId).filter((id): id is string => id !== null);
    const users = await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } });
    return grouped.map((g) => {
      const user = users.find((u) => u.id === g.customerId);
      return {
        customerId: g.customerId as string,
        name: user?.name ?? null,
        email: user?.email ?? '',
        total: Number(g._sum.total ?? 0),
        orderCount: g._count._all,
      };
    });
  }

  // Devolve, por dia entre `from` e `to`, vendas + ticket médio + visitas —
  // agrupado em memória em vez de SQL bruto, o volume atual não o justifica.
  private async dailyStats(
    where: Prisma.OrderWhereInput,
    from: Date,
    to: Date,
    dateField: 'paidAt' | 'createdAt',
  ) {
    const [orders, views] = await Promise.all([
      this.prisma.order.findMany({ where, select: { total: true, paidAt: true, createdAt: true } }),
      this.prisma.pageView.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { createdAt: true } }),
    ]);

    const salesByDay = new Map<string, { total: number; count: number }>();
    for (const order of orders) {
      const key = (order[dateField] ?? order.createdAt).toISOString().slice(0, 10);
      const bucket = salesByDay.get(key) ?? { total: 0, count: 0 };
      bucket.total += Number(order.total);
      bucket.count += 1;
      salesByDay.set(key, bucket);
    }
    const visitsByDay = new Map<string, number>();
    for (const view of views) {
      const key = view.createdAt.toISOString().slice(0, 10);
      visitsByDay.set(key, (visitsByDay.get(key) ?? 0) + 1);
    }

    return this.daysBetween(from, to).map((date) => {
      const sales = salesByDay.get(date);
      return {
        date,
        total: sales?.total ?? 0,
        count: sales?.count ?? 0,
        averageTicket: sales && sales.count > 0 ? sales.total / sales.count : 0,
        visits: visitsByDay.get(date) ?? 0,
      };
    });
  }

  // Gera as chaves de dia em UTC (não em hora local): os timestamps na base
  // de dados e o agrupamento por dia (via `toISOString().slice(0, 10)`) são
  // sempre UTC — usar meia-noite local aqui desalinhava "hoje" em qualquer
  // fuso à frente de UTC (ex. Europa/Lisboa no horário de verão).
  private daysBetween(from: Date, to: Date): string[] {
    const keys: string[] = [];
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
    while (cursor.getTime() <= end.getTime()) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return keys;
  }

  // Vendas e visitas por hora do dia (0-23), no período — mostra os horários
  // de maior atividade em vez de "acessos" (não há tracking de sessões, só
  // contagem anónima de páginas vistas).
  private async hourlyActivity(
    where: Prisma.OrderWhereInput,
    from: Date,
    to: Date,
    dateField: 'paidAt' | 'createdAt',
  ) {
    const [orders, views] = await Promise.all([
      this.prisma.order.findMany({ where, select: { paidAt: true, createdAt: true, total: true } }),
      this.prisma.pageView.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { createdAt: true } }),
    ]);

    const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, visits: 0, salesCount: 0, salesTotal: 0 }));
    for (const order of orders) {
      const bucket = hours[(order[dateField] ?? order.createdAt).getUTCHours()];
      bucket.salesCount += 1;
      bucket.salesTotal += Number(order.total);
    }
    for (const view of views) {
      hours[view.createdAt.getUTCHours()].visits += 1;
    }
    return hours;
  }

  private async salesByWeekday(where: Prisma.OrderWhereInput, dateField: 'paidAt' | 'createdAt') {
    const orders = await this.prisma.order.findMany({ where, select: { paidAt: true, createdAt: true, total: true } });

    const totals = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));
    for (const order of orders) {
      const bucket = totals[(order[dateField] ?? order.createdAt).getUTCDay()];
      bucket.total += Number(order.total);
      bucket.count += 1;
    }
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const mondayFirst = [1, 2, 3, 4, 5, 6, 0];
    return mondayFirst.map((i) => ({ weekday: labels[i], total: totals[i].total, count: totals[i].count }));
  }

  // OrderItem só guarda productId em texto (sem relação), por isso
  // categoria/marca são resolvidas à parte — produtos entretanto apagados
  // caem em "Produto descontinuado".
  private async revenueByCategory(where: Prisma.OrderWhereInput, productFilter?: string[]) {
    const items = await this.prisma.orderItem.findMany({
      where: { order: where, ...(productFilter ? { productId: { in: productFilter } } : {}) },
      select: { productId: true, unitPrice: true, quantity: true },
    });
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: { select: { name: true } } },
    });
    const categoryByProduct = new Map(products.map((p) => [p.id, p.category.name]));

    const totals = new Map<string, number>();
    for (const item of items) {
      const category = categoryByProduct.get(item.productId) ?? 'Produto descontinuado';
      totals.set(category, (totals.get(category) ?? 0) + Number(item.unitPrice) * item.quantity);
    }
    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }

  private async revenueByBrand(where: Prisma.OrderWhereInput, productFilter?: string[]) {
    const items = await this.prisma.orderItem.findMany({
      where: { order: where, ...(productFilter ? { productId: { in: productFilter } } : {}) },
      select: { productId: true, unitPrice: true, quantity: true },
    });
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, brand: { select: { name: true } } },
    });
    const brandByProduct = new Map(products.map((p) => [p.id, p.brand.name]));

    const totals = new Map<string, number>();
    for (const item of items) {
      const brand = brandByProduct.get(item.productId) ?? 'Produto descontinuado';
      totals.set(brand, (totals.get(brand) ?? 0) + Number(item.unitPrice) * item.quantity);
    }
    return Array.from(totals.entries())
      .map(([brand, total]) => ({ brand, total }))
      .sort((a, b) => b.total - a.total);
  }

  private async ordersByStatus(where: Prisma.OrderWhereInput) {
    // O filtro de estado já limita a uma única opção quando escolhido — a
    // distribuição só faz sentido a mostrar todos os estados, por isso
    // ignora esse campo do where e mantém só período/canal/categoria/marca.
    const { status: _status, ...rest } = where;
    void _status;
    const grouped = await this.prisma.order.groupBy({
      by: ['status'],
      where: rest,
      _count: { _all: true },
    });
    return grouped.map((g) => ({ status: g.status, count: g._count._all }));
  }

  private async newCustomersOverTime(from: Date, to: Date) {
    const users = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER', createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    });
    const counts = new Map<string, number>();
    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return this.daysBetween(from, to).map((date) => ({ date, count: counts.get(date) ?? 0 }));
  }

  private async topCities(where: Prisma.OrderWhereInput, limit: number) {
    const grouped = await this.prisma.order.groupBy({
      by: ['city'],
      where,
      _count: { _all: true },
      _sum: { total: true },
      orderBy: { _count: { city: 'desc' } },
      take: limit,
    });
    return grouped.map((g) => ({ city: g.city, orderCount: g._count._all, total: Number(g._sum.total ?? 0) }));
  }

  private async giftCardStats() {
    const [active, redeemed] = await Promise.all([
      this.prisma.giftCard.aggregate({ where: { status: 'ACTIVE' }, _count: true, _sum: { value: true } }),
      this.prisma.giftCard.aggregate({ where: { status: 'REDEEMED' }, _count: true, _sum: { value: true } }),
    ]);
    return {
      activeCount: active._count,
      activeValue: Number(active._sum.value ?? 0),
      redeemedCount: redeemed._count,
      redeemedValue: Number(redeemed._sum.value ?? 0),
    };
  }

  private async paymentMethodBreakdown(where: Prisma.OrderWhereInput) {
    const grouped = await this.prisma.order.groupBy({ by: ['paymentMethod'], where, _count: { _all: true } });
    return grouped.map((g) => ({ method: g.paymentMethod ?? 'Desconhecido', count: g._count._all }));
  }

  private async supportStats() {
    const total = await this.prisma.contactMessage.count();
    const messages = await this.prisma.contactMessage.findMany({
      select: {
        createdAt: true,
        replies: {
          where: { fromAdmin: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });
    const responded = messages.filter((m) => m.replies.length > 0);
    const avgResponseHours = responded.length
      ? responded.reduce((sum, m) => sum + (m.replies[0].createdAt.getTime() - m.createdAt.getTime()), 0) /
        responded.length /
        3_600_000
      : null;
    return { total, responded: responded.length, avgResponseHours };
  }
}
