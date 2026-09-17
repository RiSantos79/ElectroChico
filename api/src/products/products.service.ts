import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { sanitizeRichText } from '../common/sanitize-html.js';
import { StockService } from '../stock/stock.service.js';

// Postgres `contains`/`mode: insensitive` ignora maiúsculas/minúsculas mas
// não acentos — "maq" não bate com "máquina". Normalizamos em memória em vez
// de ativar a extensão `unaccent` na base de dados, seguindo a mesma lógica
// já usada no filtro completo do catálogo (src/lib/search.ts no frontend).
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly stock: StockService,
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

  // Autocomplete do cabeçalho: correspondência por substring, sem
  // sensibilidade a maiúsculas/minúsculas nem a acentos. A tolerância a
  // erros ortográficos mais avançada já existe no filtro completo do
  // catálogo (src/lib/search.ts no frontend).
  async search(term: string, limit = 8) {
    const q = normalize(term);
    if (!q) return [];
    const candidates = await this.prisma.product.findMany({
      where: { archived: false },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        images: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return candidates
      .filter((p) => normalize(`${p.name} ${p.brand.name} ${p.category.name}`).includes(q))
      .slice(0, limit)
      .map((p) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price, images: p.images, brand: p.brand }));
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
    const { categoryId, brandId, specs, faqs, ...rest } = dto;
    const product = await this.prisma.product.create({
      data: {
        ...rest,
        description: sanitizeRichText(rest.description),
        specs: specs as unknown as Prisma.InputJsonValue,
        faqs: faqs as unknown as Prisma.InputJsonValue,
        category: { connect: { id: categoryId } },
        brand: { connect: { id: brandId } },
      },
    });
    await this.audit.log('PRODUCT_CREATE', { entity: 'Product', entityId: product.id, actor: actorEmail });
    return product;
  }

  async update(id: string, dto: UpdateProductDto, actorEmail?: string) {
    const before = await this.ensureExists(id);
    const { categoryId, brandId, specs, faqs, ...rest } = dto;
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        description: rest.description !== undefined ? sanitizeRichText(rest.description) : undefined,
        specs: specs !== undefined ? (specs as unknown as Prisma.InputJsonValue) : undefined,
        faqs: faqs !== undefined ? (faqs as unknown as Prisma.InputJsonValue) : undefined,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        brand: brandId ? { connect: { id: brandId } } : undefined,
      },
    });
    await this.audit.log('PRODUCT_UPDATE', { entity: 'Product', entityId: id, actor: actorEmail });

    if (dto.stockQuantity !== undefined && dto.stockQuantity !== before.stockQuantity) {
      await this.stock.recordMovement({
        productId: id,
        type: 'ADJUSTMENT',
        delta: dto.stockQuantity - before.stockQuantity,
        reason: `Ajuste manual por ${actorEmail ?? 'admin'}`,
      });
    }
    return product;
  }

  async remove(id: string, actorEmail?: string) {
    await this.ensureExists(id);
    await this.prisma.product.delete({ where: { id } });
    await this.audit.log('PRODUCT_DELETE', { entity: 'Product', entityId: id, actor: actorEmail });
  }

  async removeMany(ids: string[], actorEmail?: string) {
    for (const id of ids) {
      await this.remove(id, actorEmail);
    }
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
        faqs: original.faqs as unknown as Prisma.InputJsonValue,
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
    return product;
  }
}
