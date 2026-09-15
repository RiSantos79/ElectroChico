import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('auditoria', 'view')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

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

  @Get('actions')
  listActions() {
    return this.auditService.listActions();
  }

  @Get('entities')
  listEntities() {
    return this.auditService.listEntities();
  }
}
