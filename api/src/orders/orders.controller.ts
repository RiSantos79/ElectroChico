import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RateLimit } from '../common/rate-limit.guard.js';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  @UseGuards(RateLimit({ windowMs: 60_000, max: 10 }))
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createCheckoutSession(dto);
  }

  @Get('orders/:id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  findRecent() {
    return this.ordersService.findRecent();
  }

  @Post('webhooks/stripe')
  handleWebhook(@Req() req: Request, @Headers('stripe-signature') signature?: string) {
    if (!signature) throw new BadRequestException('Assinatura do Stripe em falta.');
    return this.ordersService.handleWebhook(req.body as Buffer, signature);
  }
}
