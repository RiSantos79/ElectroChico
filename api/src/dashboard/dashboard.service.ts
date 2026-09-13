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
      recurringCustomers,
      abandonedCarts,
      stock,
      topProducts,
      dailySales,
    ] = await Promise.all([
      this.salesBetween(startOfDay, now),
      this.salesBetween(startOfPrevDay, startOfDay),
      this.salesBetween(startOfMonth, now),
      this.salesBetween(startOfPrevMonth, startOfMonth),
      this.salesBetween(startOfYear, now),
      this.salesBetween(startOfPrevYear, startOfYear),
      this.prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } } }),
      this.recurringCustomersCount(),
      this.abandonedCartsCount(),
      this.stockAlerts(),
      this.topProducts(),
      this.dailySales(30),
    ]);

    return {
      sales: { today, prevDay, month, prevMonth, year, prevYear },
      newCustomersThisMonth: newCustomers,
      recurringCustomers,
      abandonedCarts,
      stock,
      topProducts,
      dailySales,
      conversionRate: null, // requer analítica de visitas — não implementada
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

  private async recurringCustomersCount() {
    const grouped = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { status: 'PAID', customerId: { not: null } },
      _count: { _all: true },
    });
    return grouped.filter((g) => g._count._all > 1).length;
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

  private async topProducts(limit = 5) {
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

  // Agrupado em memória em vez de SQL bruto — o volume de encomendas não
  // justifica a complexidade extra de uma query de agregação por dia.
  private async dailySales(days: number) {
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { status: 'PAID', updatedAt: { gte: from } },
      select: { total: true, updatedAt: true },
    });

    const totalsByDay = new Map<string, number>();
    for (const order of orders) {
      const key = order.updatedAt.toISOString().slice(0, 10);
      totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + Number(order.total));
    }

    const series: { date: string; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString().slice(0, 10);
      series.push({ date: key, total: totalsByDay.get(key) ?? 0 });
    }
    return series;
  }
}
