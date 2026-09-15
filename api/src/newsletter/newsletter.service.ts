import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import { AuditService } from '../audit/audit.service.js';
import { sanitizeRichText } from '../common/sanitize-html.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';
import { UpdateCampaignDto } from './dto/update-campaign.dto.js';

@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly audit: AuditService,
  ) {}

  // Chamado a partir do checkout quando o cliente marca a caixa de
  // subscrição — reativa a subscrição se a pessoa já se tinha desinscrito.
  async subscribe(email: string, name?: string) {
    await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { unsubscribedAt: null, name: name ?? undefined },
      create: { email, name },
    });
  }

  findSubscribers(includeUnsubscribed: boolean) {
    return this.prisma.newsletterSubscriber.findMany({
      where: includeUnsubscribed ? undefined : { unsubscribedAt: null },
      orderBy: { subscribedAt: 'desc' },
    });
  }

  async unsubscribe(id: string) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!subscriber) throw new NotFoundException(`Subscritor com id "${id}" não encontrado`);
    return this.prisma.newsletterSubscriber.update({ where: { id }, data: { unsubscribedAt: new Date() } });
  }

  findCampaigns() {
    return this.prisma.newsletterCampaign.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createCampaign(dto: CreateCampaignDto, actorEmail?: string) {
    const campaign = await this.prisma.newsletterCampaign.create({
      data: { subject: dto.subject, body: sanitizeRichText(dto.body) },
    });
    await this.audit.log('NEWSLETTER_CAMPAIGN_CREATE', { entity: 'NewsletterCampaign', entityId: campaign.id, actor: actorEmail });
    return campaign;
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto, actorEmail?: string) {
    const campaign = await this.prisma.newsletterCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campanha com id "${id}" não encontrada`);
    if (campaign.status === 'SENT') throw new BadRequestException('Uma campanha já enviada não pode ser editada.');

    const updated = await this.prisma.newsletterCampaign.update({
      where: { id },
      data: { subject: dto.subject, body: dto.body !== undefined ? sanitizeRichText(dto.body) : undefined },
    });
    await this.audit.log('NEWSLETTER_CAMPAIGN_UPDATE', { entity: 'NewsletterCampaign', entityId: id, actor: actorEmail });
    return updated;
  }

  async removeCampaign(id: string, actorEmail?: string) {
    const campaign = await this.prisma.newsletterCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campanha com id "${id}" não encontrada`);
    if (campaign.status === 'SENT') throw new BadRequestException('Uma campanha já enviada não pode ser apagada.');
    await this.prisma.newsletterCampaign.delete({ where: { id } });
    await this.audit.log('NEWSLETTER_CAMPAIGN_DELETE', { entity: 'NewsletterCampaign', entityId: id, actor: actorEmail });
  }

  // Best-effort: tal como o lembrete de carrinho abandonado, isto fica inerte
  // (sem enviar nada, sem marcar como enviada) enquanto não houver um
  // fornecedor de email configurado.
  async sendCampaign(id: string, actorEmail?: string) {
    const campaign = await this.prisma.newsletterCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campanha com id "${id}" não encontrada`);
    if (campaign.status === 'SENT') throw new BadRequestException('Esta campanha já foi enviada.');

    const subscribers = await this.prisma.newsletterSubscriber.findMany({ where: { unsubscribedAt: null } });
    if (subscribers.length === 0) throw new BadRequestException('Não há subscritores ativos para enviar.');

    let sentCount = 0;
    for (const subscriber of subscribers) {
      const result = await this.email.send({ to: subscriber.email, subject: campaign.subject, html: campaign.body });
      // "not_configured" é um problema de configuração global (não vale a
      // pena continuar a tentar os restantes) — um "provider_error" pontual
      // só falha aquele destinatário, não a campanha toda.
      if (!result.sent && result.reason === 'not_configured') {
        return { sent: false, reason: result.reason, sentCount: 0 };
      }
      if (result.sent) sentCount += 1;
    }

    await this.prisma.newsletterCampaign.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), sentCount },
    });
    await this.audit.log('NEWSLETTER_CAMPAIGN_SENT', { entity: 'NewsletterCampaign', entityId: id, actor: actorEmail });
    return { sent: sentCount > 0, sentCount };
  }
}
