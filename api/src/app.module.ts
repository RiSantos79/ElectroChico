import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { AuditModule } from './audit/audit.module.js';
import { OrdersModule } from './orders/orders.module.js';

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
  ],
})
export class AppModule {}
