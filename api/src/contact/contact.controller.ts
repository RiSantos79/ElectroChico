import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ContactService } from './contact.service.js';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';
import { ReplyContactMessageDto } from './dto/reply-contact-message.dto.js';
import { ContactType } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { RateLimit } from '../common/rate-limit.guard.js';
import { hasPermission } from '../common/permissions.js';

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

  // Mensagens/Devoluções/Garantias partilham hoje o mesmo ContactMessage (só
  // muda o "type"), por isso qualquer uma das três permissões dá acesso à
  // caixa de entrada — a separação por tipo é feita na interface (tabs).
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('type') type?: ContactType) {
    const allowed = ['mensagens', 'devolucoes', 'garantias'] as const;
    if (!allowed.some((m) => hasPermission(user, m, 'view'))) {
      throw new ForbiddenException('Sem permissão para esta ação');
    }
    return this.contactService.findAll(type);
  }

  // Endpoint único para os dois lados da conversa — o serviço decide o que é
  // permitido consoante quem está autenticado (staff vs. dono da mensagem).
  @UseGuards(JwtAuthGuard)
  @Post(':id/replies')
  addReply(@Param('id') id: string, @Body() dto: ReplyContactMessageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.contactService.addReply(id, dto, user.sub, user.role !== 'CUSTOMER');
  }
}
