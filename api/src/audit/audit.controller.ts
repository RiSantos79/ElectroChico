import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findRecent() {
    return this.auditService.findRecent();
  }
}
