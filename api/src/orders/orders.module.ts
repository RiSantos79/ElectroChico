import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { StockModule } from '../stock/stock.module.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { EmailModule } from '../email/email.module.js';
import { NewsletterModule } from '../newsletter/newsletter.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [AuthModule, StockModule, CouponsModule, EmailModule, NewsletterModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
