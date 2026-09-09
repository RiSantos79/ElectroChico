import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(action: string, options?: { entity?: string; entityId?: string; actor?: string; ip?: string }) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entity: options?.entity,
        entityId: options?.entityId,
        actor: options?.actor,
        ip: options?.ip,
      },
    });
  }

  findRecent(limit = 200) {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  }
}
