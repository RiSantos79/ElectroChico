import { Controller, Get, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';

@Controller('stock-movements')
@UseGuards(JwtAuthGuard, AdminGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findRecent() {
    return this.stockService.findRecent();
  }
}
