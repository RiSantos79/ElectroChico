import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { sanitizeRichText } from '../common/sanitize-html.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(params: { categorySlug?: string; brandSlug?: string; includeArchived?: boolean }) {
    return this.prisma.product.findMany({
      where: {
        category: params.categorySlug ? { slug: params.categorySlug } : undefined,
        brand: params.brandSlug ? { slug: params.brandSlug } : undefined,
        archived: params.includeArchived ? undefined : false,
      },
      include: { category: true, brand: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true, brand: true },
    });
    if (!product) throw new NotFoundException(`Produto "${slug}" não encontrado`);
    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true },
    });
    if (!product) throw new NotFoundException(`Produto com id "${id}" não encontrado`);
    return product;
  }

  async create(dto: CreateProductDto, actorEmail?: string) {
    const { categoryId, brandId, specs, ...rest } = dto;
    const product = await this.prisma.product.create({
      data: {
        ...rest,
        description: sanitizeRichText(rest.description),
        specs: specs as unknown as Prisma.InputJsonValue,
        category: { connect: { id: categoryId } },
        brand: { connect: { id: brandId } },
      },
    });
    await this.audit.log('PRODUCT_CREATE', { entity: 'Product', entityId: product.id, actor: actorEmail });
    return product;
  }

  async update(id: string, dto: UpdateProductDto, actorEmail?: string) {
    await this.ensureExists(id);
    const { categoryId, brandId, specs, ...rest } = dto;
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        description: rest.description !== undefined ? sanitizeRichText(rest.description) : undefined,
        specs: specs !== undefined ? (specs as unknown as Prisma.InputJsonValue) : undefined,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        brand: brandId ? { connect: { id: brandId } } : undefined,
      },
    });
    await this.audit.log('PRODUCT_UPDATE', { entity: 'Product', entityId: id, actor: actorEmail });
    return product;
  }

  async remove(id: string, actorEmail?: string) {
    await this.ensureExists(id);
    await this.prisma.product.delete({ where: { id } });
    await this.audit.log('PRODUCT_DELETE', { entity: 'Product', entityId: id, actor: actorEmail });
  }

  // A cópia fica arquivada por omissão — evita que um produto a meio de
  // edição apareça de repente no catálogo com o mesmo preço/stock do original.
  async duplicate(id: string, actorEmail?: string) {
    const original = await this.prisma.product.findUnique({ where: { id } });
    if (!original) throw new NotFoundException(`Produto com id "${id}" não encontrado`);

    const baseSlug = `${original.slug}-copia`;
    let slug = baseSlug;
    let suffix = 2;
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const copy = await this.prisma.product.create({
      data: {
        slug,
        name: `${original.name} (cópia)`,
        brandId: original.brandId,
        categoryId: original.categoryId,
        price: original.price,
        oldPrice: original.oldPrice,
        energyClass: original.energyClass,
        images: original.images,
        stockQuantity: original.stockQuantity,
        badge: original.badge,
        color: original.color,
        description: original.description,
        specs: original.specs as unknown as Prisma.InputJsonValue,
        sku: original.sku,
        ean: original.ean,
        weightKg: original.weightKg,
        widthCm: original.widthCm,
        heightCm: original.heightCm,
        depthCm: original.depthCm,
        warrantyMonths: original.warrantyMonths,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        archived: true,
      },
    });
    await this.audit.log('PRODUCT_DUPLICATE', { entity: 'Product', entityId: copy.id, actor: actorEmail });
    return copy;
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Produto com id "${id}" não encontrado`);
  }
}
