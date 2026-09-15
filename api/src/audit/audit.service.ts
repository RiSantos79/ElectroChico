import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type AuditSearchParams = {
  actor?: string;
  action?: string;
  entity?: string;
  from?: Date;
  to?: Date;
  limit?: number;
};

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

  // Os logs são imutáveis (nenhum método de update/delete existe de propósito)
  // — pesquisar é a única forma de os consultar em detalhe.
  search(params: AuditSearchParams) {
    return this.prisma.auditLog.findMany({
      where: {
        actor: params.actor ? { contains: params.actor, mode: 'insensitive' } : undefined,
        action: params.action ? { equals: params.action } : undefined,
        entity: params.entity ? { equals: params.entity } : undefined,
        createdAt:
          params.from || params.to
            ? { gte: params.from, lte: params.to }
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit ?? 100,
    });
  }

  async listActions(): Promise<string[]> {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    });
    return rows.map((r) => r.action);
  }

  async listEntities(): Promise<string[]> {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['entity'],
      select: { entity: true },
      where: { entity: { not: null } },
      orderBy: { entity: 'asc' },
    });
    return rows.map((r) => r.entity as string);
  }
}
