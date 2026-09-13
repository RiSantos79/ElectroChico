import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCustomers() {
    const [customers, orderStats] = await Promise.all([
      this.prisma.user.findMany({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' } }),
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { status: 'PAID', customerId: { not: null } },
        _sum: { total: true },
        _count: { _all: true },
        _max: { createdAt: true },
      }),
    ]);

    const statsByCustomer = new Map(orderStats.map((s) => [s.customerId, s]));

    return customers.map((c) => {
      const stats = statsByCustomer.get(c.id);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
        totalSpent: Number(stats?._sum.total ?? 0),
        orderCount: stats?._count._all ?? 0,
        lastOrderAt: stats?._max.createdAt ?? null,
      };
    });
  }

  async findCustomerDetail(id: string) {
    const customer = await this.prisma.user.findFirst({
      where: { id, role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        addresses: true,
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const orders = await this.prisma.order.findMany({
      where: { customerId: id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return { customer, orders };
  }
}
