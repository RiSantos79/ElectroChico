import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AiProvider } from '../generated/prisma/client.js';
import { decryptSecret, encryptSecret, maskSecret } from '../common/secret-crypto.js';
import { providerAdapter, providerCatalogue } from './providers/index.js';
import { AI_FEATURE_LABELS, buildPrompt, type AiFeature } from './ai-features.js';
import type { UpdateAiSettingsDto } from './dto/update-ai-settings.dto.js';

const SINGLETON_ID = 'singleton';

// Estimativa de custo (USD por 1M de tokens) só para o ecrã de consumo — é
// deliberadamente aproximada e serve para dar ordem de grandeza, não para
// faturação. Modelos locais (Ollama) não têm custo por token.
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
};
const FALLBACK_PRICING = { input: 0.5, output: 1.5 };

function estimateCost(model: string, promptTokens: number, completionTokens: number, provider: AiProvider): number {
  if (provider === 'OLLAMA') return 0;
  const price = PRICING[model] ?? FALLBACK_PRICING;
  return (promptTokens / 1_000_000) * price.input + (completionTokens / 1_000_000) * price.output;
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private settingsRow() {
    return this.prisma.aiSettings.findUnique({ where: { id: SINGLETON_ID } });
  }

  // Só o estado — usado pelo backoffice para mostrar ou esconder os botões
  // de IA sem nunca expor configuração.
  async status() {
    const settings = await this.settingsRow();
    return { enabled: Boolean(settings?.enabled && (settings.apiKeyEncrypted || settings.provider === 'OLLAMA')) };
  }

  async getSettings() {
    const settings = await this.settingsRow();
    const apiKey = settings?.apiKeyEncrypted ? this.safeDecrypt(settings.apiKeyEncrypted) : null;
    return {
      enabled: settings?.enabled ?? false,
      provider: settings?.provider ?? ('OPENAI' as AiProvider),
      model: settings?.model ?? '',
      baseUrl: settings?.baseUrl ?? '',
      apiKeyMasked: apiKey ? maskSecret(apiKey) : null,
      configured: Boolean(apiKey),
      updatedAt: settings?.updatedAt ?? null,
      providers: providerCatalogue(),
    };
  }

  async updateSettings(dto: UpdateAiSettingsDto, actorEmail?: string) {
    // Campo vazio = manter a chave atual; só se vier texto é que se substitui.
    const apiKeyEncrypted = dto.apiKey ? encryptSecret(dto.apiKey) : undefined;
    const data = {
      enabled: dto.enabled,
      provider: dto.provider,
      model: dto.model,
      baseUrl: dto.baseUrl,
      ...(apiKeyEncrypted ? { apiKeyEncrypted } : {}),
    };

    await this.prisma.aiSettings.upsert({
      where: { id: SINGLETON_ID },
      update: data,
      create: { id: SINGLETON_ID, ...data },
    });

    await this.audit.log('AI_SETTINGS_UPDATE', {
      entity: 'AiSettings',
      actor: actorEmail,
      details: {
        enabled: dto.enabled,
        provider: dto.provider,
        model: dto.model,
        apiKeyChanged: Boolean(apiKeyEncrypted),
      },
    });

    return this.getSettings();
  }

  async removeApiKey(actorEmail?: string) {
    await this.prisma.aiSettings.upsert({
      where: { id: SINGLETON_ID },
      update: { apiKeyEncrypted: null, enabled: false },
      create: { id: SINGLETON_ID, apiKeyEncrypted: null, enabled: false },
    });
    await this.audit.log('AI_KEY_REMOVED', { entity: 'AiSettings', actor: actorEmail });
    return this.getSettings();
  }

  async testConnection(actorEmail?: string): Promise<{ ok: boolean; message: string }> {
    try {
      const { config, provider } = await this.loadConfig({ ignoreEnabled: true });
      const adapter = providerAdapter(provider);
      const result = await adapter.complete(config, {
        system: 'Responde exatamente com a palavra OK.',
        prompt: 'Teste de ligação.',
        maxTokens: 10,
      });
      await this.audit.log('AI_CONNECTION_TEST', {
        entity: 'AiSettings',
        actor: actorEmail,
        details: { provider, ok: true },
      });
      return { ok: true, message: `Ligação estabelecida (${adapter.label}): "${result.text.slice(0, 40)}"` };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      await this.audit.log('AI_CONNECTION_TEST', { entity: 'AiSettings', actor: actorEmail, details: { ok: false } });
      return { ok: false, message };
    }
  }

  async generate(feature: AiFeature, context: Record<string, string | undefined>, actorEmail?: string) {
    const { config, provider } = await this.loadConfig();
    const adapter = providerAdapter(provider);
    const { system, prompt, maxTokens } = buildPrompt(feature, context);

    try {
      const result = await adapter.complete(config, { system, prompt, maxTokens });
      await this.prisma.aiUsageLog.create({
        data: {
          feature,
          provider,
          model: config.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          estimatedCostUsd: estimateCost(config.model, result.promptTokens, result.completionTokens, provider),
          success: true,
          actor: actorEmail,
        },
      });
      return { text: result.text };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      await this.prisma.aiUsageLog.create({
        data: { feature, provider, model: config.model, success: false, errorMessage: message.slice(0, 500), actor: actorEmail },
      });
      throw new BadRequestException(`A geração falhou: ${message}`);
    }
  }

  // O assistente responde sobre o negócio real: junta um retrato compacto da
  // loja e entrega-o como contexto, em vez de deixar o modelo adivinhar.
  async assistant(question: string, actorEmail?: string) {
    const data = await this.storeSnapshot();
    return this.generate('ASSISTANT', { question, data }, actorEmail);
  }

  private async storeSnapshot(): Promise<string> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [outOfStock, lowStock, soldItems, revenue, ordersByStatus, totalProducts] = await Promise.all([
      this.prisma.product.findMany({
        where: { stockQuantity: 0, archived: false },
        select: { name: true },
        take: 25,
      }),
      this.prisma.product.findMany({
        where: { stockQuantity: { gt: 0, lte: 5 }, archived: false },
        select: { name: true, stockQuantity: true },
        orderBy: { stockQuantity: 'asc' },
        take: 15,
      }),
      this.prisma.orderItem.groupBy({
        by: ['productName'],
        where: { order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }, updatedAt: { gte: thirtyDaysAgo } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 30,
      }),
      this.prisma.order.aggregate({
        where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }, updatedAt: { gte: thirtyDaysAgo } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.product.count({ where: { archived: false } }),
    ]);

    const sold = soldItems.map((i) => `${i.productName}: ${i._sum.quantity ?? 0} un.`);
    const soldNames = new Set(soldItems.map((i) => i.productName));
    const neverSold = await this.prisma.product.findMany({
      where: { archived: false, name: { notIn: [...soldNames] } },
      select: { name: true },
      take: 20,
    });

    return [
      `Período de referência: últimos 30 dias.`,
      `Catálogo ativo: ${totalProducts} produtos.`,
      `Receita (30 dias): ${Number(revenue._sum.total ?? 0).toFixed(2)} EUR em ${revenue._count} encomendas.`,
      `Encomendas por estado: ${ordersByStatus.map((o) => `${o.status}=${o._count._all}`).join(', ') || 'nenhuma'}.`,
      `Mais vendidos (30 dias):\n${sold.slice(0, 10).join('\n') || 'sem vendas'}`,
      `Menos vendidos com vendas (30 dias):\n${sold.slice(-10).reverse().join('\n') || 'sem vendas'}`,
      `Sem qualquer venda nos últimos 30 dias:\n${neverSold.map((p) => p.name).join('\n') || 'nenhum'}`,
      `Produtos sem stock:\n${outOfStock.map((p) => p.name).join('\n') || 'nenhum'}`,
      `Produtos com stock crítico:\n${lowStock.map((p) => `${p.name} (${p.stockQuantity} un.)`).join('\n') || 'nenhum'}`,
    ].join('\n\n');
  }

  async usage(limit = 50) {
    const [recent, grouped] = await Promise.all([
      this.prisma.aiUsageLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit }),
      this.prisma.aiUsageLog.groupBy({
        by: ['feature'],
        _count: { _all: true },
        _sum: { promptTokens: true, completionTokens: true, estimatedCostUsd: true },
      }),
    ]);

    return {
      recent: recent.map((r) => ({
        id: r.id,
        feature: r.feature,
        featureLabel: AI_FEATURE_LABELS[r.feature as AiFeature] ?? r.feature,
        provider: r.provider,
        model: r.model,
        promptTokens: r.promptTokens,
        completionTokens: r.completionTokens,
        estimatedCostUsd: Number(r.estimatedCostUsd),
        success: r.success,
        errorMessage: r.errorMessage,
        actor: r.actor,
        createdAt: r.createdAt,
      })),
      byFeature: grouped
        .map((g) => ({
          feature: g.feature,
          featureLabel: AI_FEATURE_LABELS[g.feature as AiFeature] ?? g.feature,
          calls: g._count._all,
          promptTokens: g._sum.promptTokens ?? 0,
          completionTokens: g._sum.completionTokens ?? 0,
          estimatedCostUsd: Number(g._sum.estimatedCostUsd ?? 0),
        }))
        .sort((a, b) => b.calls - a.calls),
    };
  }

  // Ponto único onde se decide se a IA pode correr — qualquer funcionalidade
  // que a use passa por aqui, por isso "IA desativada" nunca chega a fazer
  // uma chamada nem rebenta noutro sítio.
  private async loadConfig(options?: { ignoreEnabled?: boolean }) {
    const settings = await this.settingsRow();
    if (!settings) throw new BadRequestException('A IA ainda não está configurada.');
    if (!options?.ignoreEnabled && !settings.enabled) throw new BadRequestException('A IA está desativada.');

    const provider = settings.provider;
    const adapter = providerAdapter(provider);
    const apiKey = (settings.apiKeyEncrypted ? this.safeDecrypt(settings.apiKeyEncrypted) : '') ?? '';
    if (adapter.requiresApiKey && !apiKey) {
      throw new BadRequestException(`É preciso configurar uma chave de API para ${adapter.label}.`);
    }

    return {
      provider,
      config: {
        apiKey,
        model: settings.model || adapter.defaultModel,
        baseUrl: settings.baseUrl || adapter.defaultBaseUrl,
      },
    };
  }

  // Uma chave cifrada com outro segredo (ex. JWT_SECRET rodado) deixa de
  // decifrar — nesse caso vale mais tratar como "sem chave" do que rebentar
  // o ecrã de configuração inteiro.
  private safeDecrypt(payload: string): string | null {
    try {
      return decryptSecret(payload);
    } catch {
      return null;
    }
  }
}
