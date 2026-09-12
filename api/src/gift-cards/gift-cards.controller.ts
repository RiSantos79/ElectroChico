import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('gift-cards')
@UseGuards(JwtAuthGuard, AdminGuard)
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.giftCardsService.findByCode(code);
  }

  @Post(':code/redeem')
  redeem(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.giftCardsService.redeem(code, user.email);
  }
}
