import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { StockService } from '../stock/stock.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { EmailService } from '../email/email.service.js';
import { NewsletterService } from '../newsletter/newsletter.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import type { UpdateOrderDto } from './dto/update-order.dto.js';
import { GIFT_CARD_CATEGORY_SLUG, generateGiftCardCode } from '../common/gift-cards.js';
import { PAID_LIKE_STATUSES } from '../common/order-status.js';
import { ABANDONED_CART_AFTER_MS } from '../common/abandoned-cart.js';

@Injectable()
export class OrdersService {
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly stock: StockService,
    private readonly coupons: CouponsService,
    private readonly email: EmailService,
    private readonly newsletter: NewsletterService,
  ) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY não está definido.');
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createCheckoutSession(dto: CreateOrderDto, customerId?: string) {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });

    const orderItemsData = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Produto "${item.productId}" não encontrado`);
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Stock insuficiente para "${product.name}"`);
      }
      return {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        recipientEmail: item.recipientEmail,
        giftMessage: item.giftMessage,
      };
    });

    // O preço vem sempre do que está gravado no produto, nunca do que o
    // cliente envia — evita alguém manipular o valor pago no browser.
    const subtotal = orderItemsData.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

    let discountAmount = 0;
    let couponCode: string | undefined;
    if (dto.couponCode) {
      const result = await this.coupons.validateAndCompute(dto.couponCode, subtotal);
      discountAmount = result.discountAmount;
      couponCode = result.coupon.code;
    }
    const total = subtotal - discountAmount;

    const order = await this.prisma.order.create({
      data: {
        customerId,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        street: dto.street,
        streetNumber: dto.streetNumber,
        floor: dto.floor,
        postalCode: dto.postalCode,
        city: dto.city,
        newsletterOptIn: dto.newsletterOptIn ?? false,
        subtotal,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        couponCode,
        total,
        items: { create: orderItemsData },
      },
    });

    // O consentimento é dado ao marcar a caixa no checkout, não depende do
    // pagamento se concretizar.
    if (dto.newsletterOptIn) {
      await this.newsletter.subscribe(dto.customerEmail, dto.customerName);
    }

    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3001';

    // O desconto é aplicado como um cupão Stripe criado na hora (válido só
    // para esta sessão) em vez de uma linha negativa — o Stripe não aceita
    // unit_amount negativo em linhas de checkout.
    const discounts =
      discountAmount > 0
        ? [
            {
              coupon: (
                await this.stripe.coupons.create({
                  amount_off: Math.round(discountAmount * 100),
                  currency: 'eur',
                  duration: 'once',
                  name: `Desconto ${couponCode}`,
                })
              ).id,
            },
          ]
        : undefined;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: dto.customerEmail,
      line_items: orderItemsData.map((item) => ({
        price_data: {
          currency: 'eur',
          product_data: { name: item.productName },
          unit_amount: Math.round(Number(item.unitPrice) * 100),
        },
        quantity: item.quantity,
      })),
      discounts,
      success_url: `${webOrigin}/checkout/sucesso?order=${order.id}`,
      cancel_url: `${webOrigin}/checkout?cancelado=1`,
      metadata: { orderId: order.id },
    });

    await this.prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });

    if (!session.url) throw new BadRequestException('O Stripe não devolveu um URL de checkout.');
    return { orderId: order.id, checkoutUrl: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET não está definido.');
    }

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) await this.markAsPaid(orderId, session.id);
    }

    return { received: true };
  }

  // Best-effort: o método de pagamento é só para estatísticas, nunca deve
  // impedir a confirmação da encomenda se a chamada extra ao Stripe falhar.
  private async fetchPaymentMethod(sessionId: string): Promise<string | null> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent.payment_method'],
      });
      const paymentIntent = session.payment_intent;
      if (!paymentIntent || typeof paymentIntent === 'string') return null;
      const paymentMethod = paymentIntent.payment_method;
      if (!paymentMethod || typeof paymentMethod === 'string') return null;
      return paymentMethod.type;
    } catch {
      return null;
    }
  }

  private async markAsPaid(orderId: string, stripeSessionId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || PAID_LIKE_STATUSES.includes(order.status)) return;

    const paymentMethod = stripeSessionId ? await this.fetchPaymentMethod(stripeSessionId) : null;
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'PAID', paymentMethod } });

    // Só conta a utilização do cupão quando o pagamento é confirmado — um
    // checkout abandonado não deve gastar o limite de utilizações.
    if (order.couponCode) {
      await this.prisma.coupon.updateMany({
        where: { code: order.couponCode },
        data: { usesCount: { increment: 1 } },
      });
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: order.items.map((i) => i.productId) } },
      include: { category: true },
    });

    // ponytail: decremento direto, sem lock — em alto volume concorrente podia
    // ficar negativo; para o volume atual não é um problema real.
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      await this.stock.recordMovement({
        productId: item.productId,
        type: 'SALE',
        delta: -item.quantity,
        orderId,
      });

      const product = products.find((p) => p.id === item.productId);
      if (product?.category.slug === GIFT_CARD_CATEGORY_SLUG) {
        await this.createGiftCard(order, item);
      }
    }
    await this.audit.log('ORDER_PAID', { entity: 'Order', entityId: orderId });
  }

  // Cancelar/reembolsar uma encomenda já paga devolve o stock — mas só uma
  // vez, por isso verifica se o estado anterior já tinha reservado stock.
  async updateStatus(id: string, dto: UpdateOrderDto, actorEmail?: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException(`Encomenda "${id}" não encontrada`);

    const isRestocking =
      dto.status &&
      ['CANCELLED', 'REFUNDED'].includes(dto.status) &&
      PAID_LIKE_STATUSES.includes(order.status) &&
      dto.status !== order.status;

    if (isRestocking) {
      for (const item of order.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
        await this.stock.recordMovement({
          productId: item.productId,
          type: 'RETURN',
          delta: item.quantity,
          orderId: id,
          reason: `Encomenda ${dto.status === 'CANCELLED' ? 'cancelada' : 'reembolsada'}`,
        });
      }
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        trackingCarrier: dto.trackingCarrier,
        trackingCode: dto.trackingCode,
      },
      include: { items: true },
    });
    await this.audit.log('ORDER_STATUS_UPDATE', { entity: 'Order', entityId: id, actor: actorEmail });
    return updated;
  }

  // Um cartão presente vale sempre o preço unitário do artigo, multiplicado
  // pela quantidade — só se gera UM código por linha da encomenda, não um
  // por unidade, porque o formulário de checkout só recolhe um destinatário
  // por linha (comprar 2 do mesmo cartão para pessoas diferentes exige duas
  // linhas separadas no carrinho).
  private async createGiftCard(
    order: { id: string; customerEmail: string },
    item: { id: string; unitPrice: unknown; quantity: number; recipientEmail: string | null; giftMessage: string | null },
  ) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await this.prisma.giftCard.create({
          data: {
            code: generateGiftCardCode(),
            value: (Number(item.unitPrice) * item.quantity).toFixed(2),
            orderId: order.id,
            orderItemId: item.id,
            buyerEmail: order.customerEmail,
            recipientEmail: item.recipientEmail,
            message: item.giftMessage,
          },
        });
        return;
      } catch {
        // colisão de código (extremamente rara) — tenta gerar outro
      }
    }
    throw new BadRequestException('Não foi possível gerar o código do cartão presente.');
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true, giftCards: true } });
    if (!order) throw new NotFoundException(`Encomenda "${id}" não encontrada`);
    return order;
  }

  findRecent(limit = 100) {
    return this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findMine(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAbandoned() {
    return this.prisma.order.findMany({
      where: { status: 'PENDING', createdAt: { lt: new Date(Date.now() - ABANDONED_CART_AFTER_MS) } },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendAbandonedCartReminder(id: string, actorEmail?: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException(`Encomenda "${id}" não encontrada`);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Esta encomenda já não está pendente.');
    }

    const itemsHtml = order.items.map((item) => `<li>${item.productName} × ${item.quantity}</li>`).join('');
    const result = await this.email.send({
      to: order.customerEmail,
      subject: 'Ainda tem artigos à sua espera na ElectroChico',
      html: `
        <p>Olá ${order.customerName},</p>
        <p>Reparámos que deixou estes artigos por finalizar:</p>
        <ul>${itemsHtml}</ul>
        <p>Volte à ElectroChico para concluir a sua compra.</p>
      `,
    });

    if (result.sent) {
      await this.prisma.order.update({ where: { id }, data: { reminderSentAt: new Date() } });
      await this.audit.log('ABANDONED_CART_REMINDER_SENT', { entity: 'Order', entityId: id, actor: actorEmail });
    }
    return result;
  }
}
