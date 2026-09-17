import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('gift-cards')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @RequirePermission('cupoes', 'view')
  @Get()
  findAll() {
    return this.giftCardsService.findAll();
  }

  @RequirePermission('cupoes', 'view')
  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.giftCardsService.findByCode(code);
  }

  @RequirePermission('cupoes', 'edit')
  @Post(':code/redeem')
  redeem(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.giftCardsService.redeem(code, user.email);
  }
}
