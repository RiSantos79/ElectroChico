import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { AuditModule } from './audit/audit.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AddressesModule } from './addresses/addresses.module.js';
import { ContactModule } from './contact/contact.module.js';
import { GiftCardsModule } from './gift-cards/gift-cards.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { UsersModule } from './users/users.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { BrandsModule } from './brands/brands.module.js';
import { StockModule } from './stock/stock.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { NewsletterModule } from './newsletter/newsletter.module.js';
import { SiteSettingsModule } from './site-settings/site-settings.module.js';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    ReviewsModule,
    UploadsModule,
    OrdersModule,
    AddressesModule,
    ContactModule,
    GiftCardsModule,
    DashboardModule,
    UsersModule,
    AnalyticsModule,
    BrandsModule,
    StockModule,
    CouponsModule,
    NewsletterModule,
    SiteSettingsModule,
  ],
})
export class AppModule {}
