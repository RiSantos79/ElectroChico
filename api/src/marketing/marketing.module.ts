import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MarketingController } from './marketing.controller.js';
import { MarketingService } from './marketing.service.js';

// A newsletter importa este módulo para empurrar contactos no opt-in; mais
// ninguém precisa de saber que o Sender existe.
@Module({
  imports: [AuthModule],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
