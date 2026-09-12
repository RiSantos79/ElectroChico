import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { RateLimit } from '../common/rate-limit.guard.js';

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly jwt: JwtService,
  ) {}

  @Post('orders')
  @UseGuards(RateLimit({ windowMs: 60_000, max: 10 }))
  async create(@Body() dto: CreateOrderDto, @Req() req: Request) {
    // Checkout de convidado continua a funcionar sem sessão — se vier um token
    // válido, a encomenda fica associada à conta; se não vier, ou for inválido,
    // segue como convidado em vez de bloquear a compra.
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const customerId = token
      ? await this.jwt
          .verifyAsync<AuthenticatedUser>(token)
          .then((payload) => payload.sub)
          .catch(() => undefined)
      : undefined;
    return this.ordersService.createCheckoutSession(dto, customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findMine(user.sub);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('orders')
  findRecent() {
    return this.ordersService.findRecent();
  }

  @Get('orders/:id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post('webhooks/stripe')
  handleWebhook(@Req() req: Request, @Headers('stripe-signature') signature?: string) {
    if (!signature) throw new BadRequestException('Assinatura do Stripe em falta.');
    return this.ordersService.handleWebhook(req.body as Buffer, signature);
  }
}
