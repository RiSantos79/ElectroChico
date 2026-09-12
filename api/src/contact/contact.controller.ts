import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ContactService } from './contact.service.js';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';
import { ContactType } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { RateLimit } from '../common/rate-limit.guard.js';

@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly jwt: JwtService,
  ) {}

  // Sugestões vêm de qualquer visitante (sem sessão); Mensagens e RMA vêm
  // normalmente de clientes autenticados — nos dois casos, se houver um token
  // válido, a mensagem fica associada à conta, mas nunca é obrigatório.
  @Post()
  @UseGuards(RateLimit({ windowMs: 60_000, max: 5 }))
  async create(@Body() dto: CreateContactMessageDto, @Req() req: Request) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const customerId = token
      ? await this.jwt
          .verifyAsync<AuthenticatedUser>(token)
          .then((payload) => payload.sub)
          .catch(() => undefined)
      : undefined;
    return this.contactService.create(dto, customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser, @Query('type') type?: ContactType) {
    return this.contactService.findMine(user.sub, type);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll(@Query('type') type?: ContactType) {
    return this.contactService.findAll(type);
  }
}
