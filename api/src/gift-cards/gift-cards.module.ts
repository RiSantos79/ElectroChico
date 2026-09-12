import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GiftCardsController } from './gift-cards.controller.js';
import { GiftCardsService } from './gift-cards.service.js';

@Module({
  imports: [AuthModule],
  controllers: [GiftCardsController],
  providers: [GiftCardsService],
})
export class GiftCardsModule {}
