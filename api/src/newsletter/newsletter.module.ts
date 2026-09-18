import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EmailModule } from '../email/email.module.js';
import { MarketingModule } from '../marketing/marketing.module.js';
import { NewsletterController } from './newsletter.controller.js';
import { NewsletterService } from './newsletter.service.js';

@Module({
  imports: [AuthModule, EmailModule, MarketingModule],
  controllers: [NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
