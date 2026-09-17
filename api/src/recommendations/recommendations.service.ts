import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { encryptSecret, maskSecret, decryptSecret } from '../ai/ai-crypto.js';
import { RulesRecommendationStrategy } from './strategies/rules.strategy.js';
import type { RecommendationKind, RecommendationRules, RecommendationStrategy } from './strategies/types.js';
import type { UpdateRecommendationSettingsDto } from './dto/update-recommendation-settings.dto.js';

const SINGLETON_ID = 'singleton';

const DEFAULTS = {
  strategy: 'RULES' as const,
  limit: 4,
  preferSameBrand: true,
  priceTolerancePct: 40,
  useCoPurchase: true,
};

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rulesStrategy: RulesRecommendationStrategy,
  ) {}

  private settingsRow() {
    return this.prisma.recommendationSettings.findUnique({ where: { id: SINGLETON_ID } });
  }

  async getSettings() {
    const settings = await this.settingsRow();
    const key = settings?.mlApiKeyEncrypted ? this.safeDecrypt(settings.mlApiKeyEncrypted) : null;
    return {
      strategy: settings?.strategy ?? DEFAULTS.strategy,
      limit: settings?.limit ?? DEFAULTS.limit,
      preferSameBrand: settings?.preferSameBrand ?? DEFAULTS.preferSameBrand,
      priceTolerancePct: settings?.priceTolerancePct ?? DEFAULTS.priceTolerancePct,
      useCoPurchase: settings?.useCoPurchase ?? DEFAULTS.useCoPurchase,
      mlEndpoint: settings?.mlEndpoint ?? '',
      mlApiKeyMasked: key ? maskSecret(key) : null,
      // Ainda não há estratégia de ML implementada — o campo existe para a
      // troca futura, mas o backoffice mostra que continua a usar regras.
      mlAvailable: false,
      updatedAt: settings?.updatedAt ?? null,
    };
  }

  async updateSettings(dto: UpdateRecommendationSettingsDto, actorEmail?: string) {
    const mlApiKeyEncrypted = dto.mlApiKey ? encryptSecret(dto.mlApiKey) : undefined;
    const data = {
      strategy: dto.strategy,
      limit: dto.limit,
      preferSameBrand: dto.preferSameBrand,
      priceTolerancePct: dto.priceTolerancePct,
      useCoPurchase: dto.useCoPurchase,
      mlEndpoint: dto.mlEndpoint,
      ...(mlApiKeyEncrypted ? { mlApiKeyEncrypted } : {}),
    };

    await this.prisma.recommendationSettings.upsert({
      where: { id: SINGLETON_ID },
      update: data,
      create: { id: SINGLETON_ID, ...data },
    });

    await this.audit.log('RECOMMENDATION_SETTINGS_UPDATE', {
      entity: 'RecommendationSettings',
      actor: actorEmail,
      details: { strategy: dto.strategy, limit: dto.limit, mlKeyChanged: Boolean(mlApiKeyEncrypted) },
    });

    return this.getSettings();
  }

  async recommend(productId: string, kind: RecommendationKind, limitOverride?: number) {
    const settings = await this.settingsRow();
    const rules: RecommendationRules = {
      preferSameBrand: settings?.preferSameBrand ?? DEFAULTS.preferSameBrand,
      priceTolerancePct: settings?.priceTolerancePct ?? DEFAULTS.priceTolerancePct,
      useCoPurchase: settings?.useCoPurchase ?? DEFAULTS.useCoPurchase,
    };
    const limit = limitOverride ?? settings?.limit ?? DEFAULTS.limit;

    const ids = await this.strategy(settings?.strategy).recommend({ productId, kind, limit }, rules);
    if (ids.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: { category: true, brand: true },
    });
    // A ordem vem da estratégia; o findMany devolve-a baralhada.
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is (typeof products)[number] => Boolean(p));
  }

  // Um único sítio decide quem responde. Quando existir uma estratégia de ML,
  // é aqui que ela entra — e se falhar, cai para regras em vez de partir a loja.
  private strategy(kind?: 'RULES' | 'ML'): RecommendationStrategy {
    if (kind === 'ML') {
      this.logger.warn('Estratégia ML pedida mas ainda não implementada — a usar regras.');
    }
    return this.rulesStrategy;
  }

  private safeDecrypt(payload: string): string | null {
    try {
      return decryptSecret(payload);
    } catch {
      return null;
    }
  }
}
