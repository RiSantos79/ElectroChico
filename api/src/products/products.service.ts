import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: { categorySlug?: string; brand?: string }) {
    return this.prisma.product.findMany({
      where: {
        category: params.categorySlug ? { slug: params.categorySlug } : undefined,
        brand: params.brand,
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product) throw new NotFoundException(`Produto "${slug}" não encontrado`);
    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException(`Produto com id "${id}" não encontrado`);
    return product;
  }

  create(dto: CreateProductDto) {
    const { categoryId, specs, ...rest } = dto;
    return this.prisma.product.create({
      data: {
        ...rest,
        specs: specs as unknown as Prisma.InputJsonValue,
        category: { connect: { id: categoryId } },
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);
    const { categoryId, specs, ...rest } = dto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        specs: specs !== undefined ? (specs as unknown as Prisma.InputJsonValue) : undefined,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.product.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Produto com id "${id}" não encontrado`);
  }
}
