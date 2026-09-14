import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { StockMovementType } from '../generated/prisma/client.js';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  recordMovement(params: { productId: string; type: StockMovementType; delta: number; reason?: string; orderId?: string }) {
    if (params.delta === 0) return null;
    return this.prisma.stockMovement.create({ data: params });
  }

  findRecent(limit = 200) {
    return this.prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { product: { select: { name: true, slug: true } } },
    });
  }
}
