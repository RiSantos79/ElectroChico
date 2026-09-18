import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { decryptSecret, encryptSecret, maskSecret } from '../common/secret-crypto.js';
import { SenderClient } from './sender.client.js';
import type { UpdateMarketingSettingsDto } from './dto/update-marketing-settings.dto.js';

const SINGLETON_ID = 'singleton';

// Estados que contam como compra concretizada para os campos comerciais.
const PAID_LIKE_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private settingsRow() {
    return this.prisma.marketingSettings.findUnique({ where: { id: SINGLETON_ID } });
  }

  // Só o estado — o backoffice usa isto para mostrar avisos sem nunca receber
  // configuração nem chaves.
  async status() {
    const settings = await this.settingsRow();
    return {
      enabled: Boolean(settings?.enabled && settings.apiKeyEncrypted && settings.groupId),
      lastSyncAt: settings?.lastSyncAt ?? null,
      lastSyncResult: settings?.lastSyncResult ?? null,
    };
  }

  async getSettings() {
    const settings = await this.settingsRow();
    const apiKey = settings?.apiKeyEncrypted ? this.safeDecrypt(settings.apiKeyEncrypted) : null;
    return {
      enabled: settings?.enabled ?? false,
      groupId: settings?.groupId ?? '',
      // Nunca a chave completa: só o suficiente para o gestor reconhecer qual é.
      apiKeyMasked: apiKey ? maskSecret(apiKey) : '',
      hasApiKey: Boolean(settings?.apiKeyEncrypted),
      lastSyncAt: settings?.lastSyncAt ?? null,
      lastSyncResult: settings?.lastSyncResult ?? null,
    };
  }

  async updateSettings(dto: UpdateMarketingSettingsDto, actorEmail?: string) {
    // Campo vazio = manter a chave atual; só se vier texto é que se substitui.
    const apiKeyEncrypted = dto.apiKey ? encryptSecret(dto.apiKey) : undefined;
    const data = {
      enabled: dto.enabled,
      groupId: dto.groupId,
      ...(apiKeyEncrypted ? { apiKeyEncrypted } : {}),
    };

    await this.prisma.marketingSettings.upsert({
      where: { id: SINGLETON_ID },
      update: data,
      create: { id: SINGLETON_ID, ...data },
    });

    await this.audit.log('MARKETING_SETTINGS_UPDATE', {
      entity: 'MarketingSettings',
      actor: actorEmail,
      details: { enabled: dto.enabled, groupId: dto.groupId, apiKeyChanged: Boolean(apiKeyEncrypted) },
    });

    return this.getSettings();
  }

  async removeApiKey(actorEmail?: string) {
    await this.prisma.marketingSettings.update({
      where: { id: SINGLETON_ID },
      // Sem chave a integração não funciona: desligar evita tentativas mudas.
      data: { apiKeyEncrypted: null, enabled: false },
    });
    await this.audit.log('MARKETING_KEY_REMOVED', { entity: 'MarketingSettings', actor: actorEmail });
    return this.getSettings();
  }

  /** Lista os grupos da conta — serve de teste de ligação e alimenta a escolha
   *  do grupo de destino no backoffice. */
  async listGroups() {
    const client = await this.client();
    if (!client) return { ok: false as const, error: 'Integração sem chave configurada.' };

    const result = await client.listGroups();
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, groups: result.data };
  }

  // Empurra um contacto. Silencioso quando a integração está desligada: o
  // checkout nunca pode falhar por causa do email marketing.
  async syncContact(email: string): Promise<boolean> {
    const client = await this.client();
    const settings = await this.settingsRow();
    if (!client || !settings?.groupId) return false;

    const subscriber = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (!subscriber) return false;

    if (subscriber.unsubscribedAt) {
      const result = await client.unsubscribeContact(email);
      if (!result.ok) this.logger.warn(`Falha a cancelar ${email} no Sender: ${result.error}`);
      return result.ok;
    }

    const [firstName, ...rest] = (subscriber.name ?? '').trim().split(/\s+/);
    const result = await client.upsertContact({
      email,
      firstName: firstName || undefined,
      lastName: rest.length ? rest.join(' ') : undefined,
      groupIds: [settings.groupId],
      fields: await this.commercialFields(email, subscriber.subscribedAt),
    });

    if (!result.ok) {
      this.logger.warn(`Falha a sincronizar ${email} no Sender: ${result.error}`);
      return false;
    }

    await this.prisma.newsletterSubscriber.update({ where: { email }, data: { syncedAt: new Date() } });
    return true;
  }

  // Sincronização completa. Existe sobretudo para repovoar uma conta nova e
  // vazia (na entrega ao cliente, a conta muda mas a lista é nossa).
  async syncAll(actorEmail?: string) {
    const client = await this.client();
    if (!client) return { ok: false as const, error: 'Integração sem chave configurada.' };

    const subscribers = await this.prisma.newsletterSubscriber.findMany({ select: { email: true } });
    let synced = 0;
    let failed = 0;
    for (const subscriber of subscribers) {
      if (await this.syncContact(subscriber.email)) synced += 1;
      else failed += 1;
    }

    const result = `${synced} sincronizado(s), ${failed} com erro`;
    await this.prisma.marketingSettings.update({
      where: { id: SINGLETON_ID },
      data: { lastSyncAt: new Date(), lastSyncResult: result },
    });
    await this.audit.log('MARKETING_SYNC_ALL', {
      entity: 'MarketingSettings',
      actor: actorEmail,
      details: { total: subscribers.length, synced, failed },
    });

    return { ok: true as const, total: subscribers.length, synced, failed };
  }

  // Os campos que dão valor à segmentação do lado do Sender: sem eles, lá só
  // existe uma lista de emails e nenhuma automação interessante é possível.
  private async commercialFields(email: string, subscribedAt: Date) {
    const orders = await this.prisma.order.findMany({
      where: { customerEmail: email, status: { in: [...PAID_LIKE_STATUSES] } },
      select: { total: true, paidAt: true, createdAt: true },
    });

    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const lastOrder = orders
      .map((order) => order.paidAt ?? order.createdAt)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      total_encomendas: orders.length,
      valor_gasto: Number(totalSpent.toFixed(2)),
      data_subscricao: subscribedAt.toISOString().slice(0, 10),
      ...(lastOrder ? { ultima_compra: lastOrder.toISOString().slice(0, 10) } : {}),
    };
  }

  private async client(): Promise<SenderClient | null> {
    const settings = await this.settingsRow();
    if (!settings?.enabled || !settings.apiKeyEncrypted) return null;
    const apiKey = this.safeDecrypt(settings.apiKeyEncrypted);
    return apiKey ? new SenderClient(apiKey) : null;
  }

  // Uma chave que já não decifra (JWT_SECRET rodado, linha adulterada) não
  // deve rebentar o checkout — trata-se como "sem integração".
  private safeDecrypt(payload: string): string | null {
    try {
      return decryptSecret(payload);
    } catch {
      this.logger.error('Não foi possível decifrar a chave do Sender — verifique AI_ENCRYPTION_KEY/JWT_SECRET.');
      return null;
    }
  }
}
