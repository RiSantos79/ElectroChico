import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { LogExportDto } from './dto/log-export.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { StaffGuard } from '../auth/staff.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('auditoria', 'view')
  @Get()
  search(
    @Query('actor') actor?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditService.search({
      actor,
      action,
      entity,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  // Quem gere utilizadores tem de ver isto — é na página deles que aparece.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('utilizadores', 'view')
  @Get('auth-threats')
  authThreats() {
    return this.auditService.authThreats();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('auditoria', 'view')
  @Get('actions')
  listActions() {
    return this.auditService.listActions();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('auditoria', 'view')
  @Get('entities')
  listEntities() {
    return this.auditService.listEntities();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('auditoria', 'view')
  @Get('security-alerts')
  securityAlerts() {
    return this.auditService.securityAlerts();
  }

  // Chamado pelas rotas de exportação (Next.js) depois de gerarem o CSV —
  // qualquer conta de staff pode registar a sua própria exportação, não
  // exige a permissão de auditoria (essa é só para ver o histórico completo).
  @UseGuards(JwtAuthGuard, StaffGuard)
  @Post('log-export')
  async logExport(@Body() dto: LogExportDto, @CurrentUser() user: AuthenticatedUser) {
    await this.auditService.log('DATA_EXPORT', { entity: dto.entity, entityId: String(dto.count), actor: user.email });
    return { ok: true };
  }
}
