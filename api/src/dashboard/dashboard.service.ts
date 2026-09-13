import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const STOCK_CRITICAL_THRESHOLD = 5;
const ABANDONED_CART_AFTER_MS = 60 * 60 * 1000; // 1h sem pagar = considera-se abandonado

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfPrevDay = new Date(startOfDay);
    startOfPrevDay.setDate(startOfPrevDay.getDate() - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfPrevYear = new Date(now.getFullYear() - 1, 0, 1);

    const [
      today,
      prevDay,
      month,
      prevMonth,
      year,
      prevYear,
      newCustomers,
      loyalty,
      abandonedCarts,
      stock,
      topProducts,
      topCustomers,
      dailyStats,
      hourlyActivity,
      salesByWeekday,
      revenueByCategory,
      newCustomersOverTime,
      topCities,
      giftCardStats,
      paymentMethods,
      support,
    ] = await Promise.all([
      this.salesBetween(startOfDay, now),
      this.salesBetween(startOfPrevDay, startOfDay),
      this.salesBetween(startOfMonth, now),
      this.salesBetween(startOfPrevMonth, startOfMonth),
      this.salesBetween(startOfYear, now),
      this.salesBetween(startOfPrevYear, startOfYear),
      this.prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } } }),
      this.customerLoyalty(),
      this.abandonedCartsCount(),
      this.stockAlerts(),
      this.topProducts(10),
      this.topCustomers(10),
      this.dailyStats(30),
      this.hourlyActivity(30),
      this.salesByWeekday(90),
      this.revenueByCategory(),
      this.newCustomersOverTime(90),
      this.topCities(20),
      this.giftCardStats(),
      this.paymentMethodBreakdown(),
      this.supportStats(),
    ]);

    return {
      sales: { today, prevDay, month, prevMonth, year, prevYear },
      newCustomersThisMonth: newCustomers,
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
      newCustomersOverTime,
      topCities,
      giftCardStats,
      paymentMethods,
      support,
    };
  }

  private async salesBetween(from: Date, to: Date) {
    const result = await this.prisma.order.aggregate({
      where: { status: 'PAID', updatedAt: { gte: from, lt: to } },
      _sum: { total: true },
      _count: true,
    });
    const total = Number(result._sum.total ?? 0);
    const count = result._count;
    return { total, count, averageTicket: count > 0 ? total / count : 0 };
  }

  private async customerLoyalty() {
    const grouped = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { status: 'PAID', customerId: { not: null } },
      _count: { _all: true },
    });
    const recurring = grouped.filter((g) => g._count._all > 1).length;
    return { recurring, oneTime: grouped.length - recurring };
  }

  private abandonedCartsCount() {
    return this.prisma.order.count({
      where: { status: 'PENDING', createdAt: { lt: new Date(Date.now() - ABANDONED_CART_AFTER_MS) } },
    });
  }

  private async stockAlerts() {
    const [outOfStock, critical, criticalList] = await Promise.all([
      this.prisma.product.count({ where: { stockQuantity: 0 } }),
      this.prisma.product.count({
        where: { stockQuantity: { gt: 0, lte: STOCK_CRITICAL_THRESHOLD } },
      }),
      this.prisma.product.findMany({
        where: { stockQuantity: { lte: STOCK_CRITICAL_THRESHOLD } },
        orderBy: { stockQuantity: 'asc' },
        take: 10,
        select: { id: true, name: true, slug: true, stockQuantity: true },
      }),
    ]);
    return { outOfStock, critical, criticalList };
  }

  private async topProducts(limit: number) {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: { order: { status: 'PAID' } },
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

  private async topCustomers(limit: number) {
    const grouped = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { status: 'PAID', customerId: { not: null } },
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });
    const ids = grouped.map((g) => g.customerId).filter((id): id is string => id !== null);
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true },
    });
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

  // Devolve, por dia dos últimos N dias, vendas + ticket médio + visitas —
  // agrupado em memória em vez de SQL bruto, o volume atual não o justifica.
  private async dailyStats(days: number) {
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);

    const [orders, views] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: 'PAID', updatedAt: { gte: from } },
        select: { total: true, updatedAt: true },
      }),
      this.prisma.pageView.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true },
      }),
    ]);

    const salesByDay = new Map<string, { total: number; count: number }>();
    for (const order of orders) {
      const key = order.updatedAt.toISOString().slice(0, 10);
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

    return this.trailingDays(days).map((date) => {
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
  private trailingDays(days: number): string[] {
    const now = new Date();
    const keys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      keys.push(day.toISOString().slice(0, 10));
    }
    return keys;
  }

  // Vendas e visitas por hora do dia (0-23), últimos N dias — mostra os
  // horários de maior atividade em vez de "acessos" (não há tracking de
  // sessões, só contagem anónima de páginas vistas).
  private async hourlyActivity(days: number) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [orders, views] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: 'PAID', updatedAt: { gte: from } },
        select: { updatedAt: true, total: true },
      }),
      this.prisma.pageView.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true },
      }),
    ]);

    const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, visits: 0, salesCount: 0, salesTotal: 0 }));
    for (const order of orders) {
      const bucket = hours[order.updatedAt.getUTCHours()];
      bucket.salesCount += 1;
      bucket.salesTotal += Number(order.total);
    }
    for (const view of views) {
      hours[view.createdAt.getUTCHours()].visits += 1;
    }
    return hours;
  }

  private async salesByWeekday(days: number) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const orders = await this.prisma.order.findMany({
      where: { status: 'PAID', updatedAt: { gte: from } },
      select: { updatedAt: true, total: true },
    });

    const totals = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));
    for (const order of orders) {
      const bucket = totals[order.updatedAt.getUTCDay()];
      bucket.total += Number(order.total);
      bucket.count += 1;
    }
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const mondayFirst = [1, 2, 3, 4, 5, 6, 0];
    return mondayFirst.map((i) => ({ weekday: labels[i], total: totals[i].total, count: totals[i].count }));
  }

  // OrderItem só guarda productId em texto (sem relação), por isso a
  // categoria é resolvida à parte — produtos entretanto apagados caem em
  // "Produto descontinuado".
  private async revenueByCategory() {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { status: 'PAID' } },
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

  private async newCustomersOverTime(days: number) {
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);
    const users = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER', createdAt: { gte: from } },
      select: { createdAt: true },
    });
    const counts = new Map<string, number>();
    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return this.trailingDays(days).map((date) => ({ date, count: counts.get(date) ?? 0 }));
  }

  private async topCities(limit: number) {
    const grouped = await this.prisma.order.groupBy({
      by: ['city'],
      where: { status: 'PAID' },
      _count: { _all: true },
      _sum: { total: true },
      orderBy: { _count: { city: 'desc' } },
      take: limit,
    });
    return grouped.map((g) => ({
      city: g.city,
      orderCount: g._count._all,
      total: Number(g._sum.total ?? 0),
    }));
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

  private async paymentMethodBreakdown() {
    const grouped = await this.prisma.order.groupBy({
      by: ['paymentMethod'],
      where: { status: 'PAID' },
      _count: { _all: true },
    });
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
