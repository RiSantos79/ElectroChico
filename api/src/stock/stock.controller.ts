import { Controller, Get, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';

@Controller('stock-movements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @RequirePermission('stock', 'view')
  @Get()
  findRecent() {
    return this.stockService.findRecent();
  }
}
