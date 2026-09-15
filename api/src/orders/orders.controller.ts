import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
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

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('encomendas', 'view')
  @Get('orders')
  findRecent() {
    return this.ordersService.findRecent();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('encomendas', 'view')
  @Get('orders/abandoned')
  findAbandoned() {
    return this.ordersService.findAbandoned();
  }

  @Get('orders/:id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('encomendas', 'edit')
  @Patch('orders/:id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.updateStatus(id, dto, user.email);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('encomendas', 'edit')
  @Post('orders/:id/remind')
  sendReminder(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.sendAbandonedCartReminder(id, user.email);
  }

  @Post('webhooks/stripe')
  handleWebhook(@Req() req: Request, @Headers('stripe-signature') signature?: string) {
    if (!signature) throw new BadRequestException('Assinatura do Stripe em falta.');
    return this.ordersService.handleWebhook(req.body as Buffer, signature);
  }
}
