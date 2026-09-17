import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  RecommendationKind,
  RecommendationRequest,
  RecommendationRules,
  RecommendationStrategy,
} from './types.js';

type Candidate = {
  id: string;
  price: number;
  brandId: string;
  categoryId: string;
  rating: number;
  inStock: boolean;
};

@Injectable()
export class RulesRecommendationStrategy implements RecommendationStrategy {
  readonly name = 'rules';

  constructor(private readonly prisma: PrismaService) {}

  async recommend(request: RecommendationRequest, rules: RecommendationRules): Promise<string[]> {
    const base = await this.prisma.product.findUnique({
      where: { id: request.productId },
      select: { id: true, price: true, brandId: true, categoryId: true },
    });
    if (!base) return [];

    const basePrice = Number(base.price);

    // "Comprados em conjunto" é a única regra que não olha para atributos do
    // produto — sai do histórico real de encomendas.
    const coPurchase = rules.useCoPurchase ? await this.coPurchaseCounts(request.productId) : new Map<string, number>();
    if (request.kind === 'BOUGHT_TOGETHER') {
      const ids = [...coPurchase.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
      return this.keepAvailable(ids, request.limit);
    }

    const candidates = await this.candidates(base.id, request.kind, base.categoryId);
    const scored = candidates
      .map((c) => ({ id: c.id, score: this.score(c, { basePrice, base, kind: request.kind, rules, coPurchase }) }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, request.limit).map((c) => c.id);
  }

  // ponytail: carrega os candidatos e pontua em memória. Com o catálogo atual
  // (dezenas de produtos) é instantâneo; se um dia forem dezenas de milhares,
  // o filtro passa a ser feito em SQL antes de pontuar.
  private async candidates(excludeId: string, kind: RecommendationKind, categoryId: string): Promise<Candidate[]> {
    const products = await this.prisma.product.findMany({
      where: {
        id: { not: excludeId },
        archived: false,
        // Cross-selling procura complementos: outras categorias. As restantes
        // regras ficam dentro da mesma categoria.
        ...(kind === 'CROSS_SELL' ? { categoryId: { not: categoryId } } : { categoryId }),
      },
      select: { id: true, price: true, brandId: true, categoryId: true, rating: true, stockQuantity: true },
    });

    return products.map((p) => ({
      id: p.id,
      price: Number(p.price),
      brandId: p.brandId,
      categoryId: p.categoryId,
      rating: p.rating,
      inStock: p.stockQuantity > 0,
    }));
  }

  private score(
    candidate: Candidate,
    ctx: {
      basePrice: number;
      base: { brandId: string; categoryId: string };
      kind: RecommendationKind;
      rules: RecommendationRules;
      coPurchase: Map<string, number>;
    },
  ): number {
    const { basePrice, base, kind, rules, coPurchase } = ctx;
    let score = 1;

    if (kind === 'UPSELL') {
      // Só faz sentido sugerir acima — e sem saltar para outro campeonato.
      if (candidate.price <= basePrice) return 0;
      if (candidate.price > basePrice * 2) return 0;
      score += 3 - (candidate.price / basePrice - 1) * 2;
      score += candidate.rating / 2;
    }

    if (kind === 'CROSS_SELL') {
      // Complementos costumam ser mais baratos que o produto principal.
      if (candidate.price > basePrice) return 0;
      score += 2 * (1 - candidate.price / Math.max(basePrice, 1));
    }

    if (kind === 'RELATED') {
      if (candidate.categoryId === base.categoryId) score += 3;
      const distance = Math.abs(candidate.price - basePrice) / Math.max(basePrice, 1);
      const tolerance = rules.priceTolerancePct / 100;
      if (distance <= tolerance) score += 2 * (1 - distance / Math.max(tolerance, 0.01));
      score += candidate.rating / 4;
    }

    if (rules.preferSameBrand && candidate.brandId === base.brandId) score += 2;
    if (rules.useCoPurchase) score += Math.min(coPurchase.get(candidate.id) ?? 0, 5) * 1.5;
    // Recomendar algo esgotado é um beco sem saída — desce, mas não desaparece.
    if (!candidate.inStock) score -= 2;

    return Math.max(score, 0);
  }

  // Produtos que apareceram em encomendas onde este também apareceu.
  private async coPurchaseCounts(productId: string): Promise<Map<string, number>> {
    const lines = await this.prisma.orderItem.findMany({
      where: { productId },
      select: { orderId: true },
      distinct: ['orderId'],
      take: 500,
    });
    if (lines.length === 0) return new Map();

    const siblings = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { orderId: { in: lines.map((l) => l.orderId) }, productId: { not: productId } },
      _count: { _all: true },
    });

    return new Map(siblings.map((s) => [s.productId, s._count._all]));
  }

  private async keepAvailable(ids: string[], limit: number): Promise<string[]> {
    if (ids.length === 0) return [];
    const available = await this.prisma.product.findMany({
      where: { id: { in: ids }, archived: false },
      select: { id: true },
    });
    const allowed = new Set(available.map((p) => p.id));
    return ids.filter((id) => allowed.has(id)).slice(0, limit);
  }
}
