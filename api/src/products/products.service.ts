import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthService } from '../auth/auth.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import type { BulkImportProductsDto } from './dto/bulk-import-product.dto.js';
import { sanitizeRichText } from '../common/sanitize-html.js';
import { StockService } from '../stock/stock.service.js';
import { slugify } from '../common/slugify.js';

// Alterações de preço acima disto exigem confirmação extra (reauth), tal como
// promover um funcionário a administrador — o impacto financeiro é grande
// demais para bastar um único clique.
const BULK_PRICE_REAUTH_THRESHOLD_PERCENT = 20;

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
    private readonly auth: AuthService,
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

  // Aplica o mesmo valor fixo (em euros) a vários produtos de uma vez (ex.:
  // +5€ numa categoria inteira) — evita os cêntimos estranhos que um aumento
  // em percentagem produzia. A pré-visualização já foi mostrada no frontend
  // com os mesmos preços atuais, por isso aqui só é preciso aplicar e registar.
  async bulkPriceChange(ids: string[], amount: number, actorId: string, actorEmail?: string, reauthToken?: string) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, price: true },
    });

    // O impacto de um valor fixo depende do preço de cada produto — um +5€
    // é irrelevante numa TV de 800€ mas duplica o preço de um acessório de
    // 5€. Exige confirmação extra se, para algum produto, isso ultrapassar
    // a mesma percentagem-limite usada antes para alterações em massa.
    const maxPercentImpact = products.length
      ? Math.max(...products.map((p) => (Math.abs(amount) / Number(p.price)) * 100))
      : 0;
    if (maxPercentImpact > BULK_PRICE_REAUTH_THRESHOLD_PERCENT) {
      await this.auth.verifyReauthToken(actorId, reauthToken);
    }

    await this.prisma.$transaction(
      products.map((p) => {
        const newPrice = Math.max(0, Math.round((Number(p.price) + amount) * 100) / 100);
        return this.prisma.product.update({ where: { id: p.id }, data: { price: newPrice } });
      }),
    );

    await this.audit.log('PRODUCT_BULK_PRICE_CHANGE', {
      entity: 'Product',
      actor: actorEmail,
      details: { amount, count: products.length },
    });

    return { updated: products.length };
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

  // Cada linha é criada/atualizada isoladamente: uma linha inválida (marca
  // desconhecida, etc.) fica reportada em `errors` sem impedir as restantes.
  async bulkImport(dto: BulkImportProductsDto, actorEmail?: string) {
    const [brands, categories] = await Promise.all([
      this.prisma.brand.findMany(),
      this.prisma.category.findMany(),
    ]);
    const brandBySlug = new Map(brands.map((b) => [b.slug, b.id]));
    const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    let created = 0;
    let updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < dto.rows.length; i++) {
      const row = dto.rows[i];
      try {
        if (row.id) {
          await this.ensureExists(row.id);
          const brandId = brandBySlug.get(row.brand);
          const categoryId = categoryBySlug.get(row.category);
          if (!brandId) throw new Error(`Marca "${row.brand}" não encontrada`);
          if (!categoryId) throw new Error(`Categoria "${row.category}" não encontrada`);
          await this.prisma.product.update({
            where: { id: row.id },
            data: {
              name: row.name,
              brandId,
              categoryId,
              sku: row.sku,
              ean: row.ean,
              price: row.price,
              oldPrice: row.oldPrice,
              stockQuantity: row.stockQuantity,
              energyClass: row.energyClass,
              archived: row.archived,
            },
          });
          updated++;
        } else {
          const brandId = brandBySlug.get(row.brand);
          const categoryId = categoryBySlug.get(row.category);
          if (!brandId) throw new Error(`Marca "${row.brand}" não encontrada`);
          if (!categoryId) throw new Error(`Categoria "${row.category}" não encontrada`);

          const baseSlug = slugify(row.name);
          let slug = baseSlug;
          let suffix = 2;
          while (await this.prisma.product.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${suffix++}`;
          }

          await this.prisma.product.create({
            data: {
              slug,
              name: row.name,
              brandId,
              categoryId,
              sku: row.sku,
              ean: row.ean,
              price: row.price,
              oldPrice: row.oldPrice,
              stockQuantity: row.stockQuantity ?? 0,
              energyClass: row.energyClass ?? 'A',
              color: '#1f2937',
              description: '',
              specs: [],
              archived: row.archived ?? false,
            },
          });
          created++;
        }
      } catch (e) {
        errors.push({ row: i + 1, message: e instanceof Error ? e.message : 'Erro desconhecido' });
      }
    }

    await this.audit.log('PRODUCT_BULK_IMPORT', {
      entity: 'Product',
      actor: actorEmail,
      details: { created, updated, errors: errors.length },
    });

    return { created, updated, errors };
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Produto com id "${id}" não encontrado`);
    return product;
  }
}
