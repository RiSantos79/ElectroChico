import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('dashboard', 'view')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  // O utilizador segue para o serviço porque o conteúdo do dashboard depende
  // das permissões de quem o pede, não apenas de poder abrir a página.
  getSummary(@Query() filters: DashboardFiltersDto, @CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getSummary(filters, user);
  }
}
