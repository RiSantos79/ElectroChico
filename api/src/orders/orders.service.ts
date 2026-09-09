import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY não está definido.');
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createCheckoutSession(dto: CreateOrderDto) {
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
      };
    });

    // O preço vem sempre do que está gravado no produto, nunca do que o
    // cliente envia — evita alguém manipular o valor pago no browser.
    const subtotal = orderItemsData.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

    const order = await this.prisma.order.create({
      data: {
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        street: dto.street,
        streetNumber: dto.streetNumber,
        floor: dto.floor,
        postalCode: dto.postalCode,
        city: dto.city,
        subtotal,
        total: subtotal,
        items: { create: orderItemsData },
      },
    });

    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3001';

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
      if (orderId) await this.markAsPaid(orderId);
    }

    return { received: true };
  }

  private async markAsPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status === 'PAID') return;

    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } });
    // ponytail: decremento direto, sem lock — em alto volume concorrente podia
    // ficar negativo; para o volume atual não é um problema real.
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }
    await this.audit.log('ORDER_PAID', { entity: 'Order', entityId: orderId });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
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
}
