import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(productId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Produto com id "${productId}" não encontrado`);

    await this.prisma.review.create({ data: { ...dto, productId } });
    return this.recalculate(productId);
  }

  private async recalculate(productId: string) {
    const aggregate = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
        reviewCount: aggregate._count,
      },
    });
  }
}
