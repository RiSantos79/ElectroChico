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

  log(
    action: string,
    options?: { entity?: string; entityId?: string; actor?: string; ip?: string; details?: object },
  ) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entity: options?.entity,
        entityId: options?.entityId,
        actor: options?.actor,
        ip: options?.ip,
        details: options?.details,
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

  // Junta vários tipos de evento sensível (já registados no AuditLog) numa
  // única lista ordenada por data, para quem consome isto não ter de saber
  // nada sobre a forma como cada tipo é gravado.
  async securityAlerts() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [lockouts, staffCreations, roleChanges, permissionChanges, exports, newDevices] = await Promise.all([
      this.prisma.auditLog.findMany({ where: { action: 'LOGIN_BLOCKED_LOCKOUT', createdAt: { gte: since } } }),
      this.prisma.auditLog.findMany({ where: { action: 'STAFF_CREATE', createdAt: { gte: since } } }),
      this.prisma.auditLog.findMany({ where: { action: 'ROLE_CHANGED', createdAt: { gte: since } } }),
      this.prisma.auditLog.findMany({ where: { action: 'PERMISSIONS_CHANGED', createdAt: { gte: since } } }),
      this.prisma.auditLog.findMany({ where: { action: 'DATA_EXPORT', createdAt: { gte: since } } }),
      this.prisma.auditLog.findMany({ where: { action: 'NEW_DEVICE_LOGIN', createdAt: { gte: since } } }),
    ]);

    // "Criação de novos administradores" cobre tanto contas criadas já como
    // SUPER_ADMIN/ADMIN como contas promovidas depois — em ambos os casos só
    // interessa se a role ATUAL do utilizador afetado é de nível admin.
    const candidateIds = [...staffCreations, ...roleChanges]
      .map((l) => l.entityId)
      .filter((id): id is string => id !== null);
    const adminUsers =
      candidateIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: candidateIds }, role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
            select: { id: true, email: true },
          })
        : [];
    const adminUserById = new Map(adminUsers.map((u) => [u.id, u.email]));

    type Alert = { type: string; message: string; actor: string | null; createdAt: Date };
    const alerts: Alert[] = [];

    for (const l of lockouts) {
      alerts.push({ type: 'LOCKOUT', message: `Conta bloqueada por tentativas de login falhadas`, actor: l.actor, createdAt: l.createdAt });
    }
    for (const l of staffCreations) {
      const email = l.entityId ? adminUserById.get(l.entityId) : undefined;
      if (email) alerts.push({ type: 'ADMIN_CREATED', message: `Nova conta de administrador criada: ${email}`, actor: l.actor, createdAt: l.createdAt });
    }
    for (const l of roleChanges) {
      const email = l.entityId ? adminUserById.get(l.entityId) : undefined;
      if (email) alerts.push({ type: 'ADMIN_PROMOTED', message: `Conta promovida a administrador: ${email}`, actor: l.actor, createdAt: l.createdAt });
    }
    for (const l of permissionChanges) {
      alerts.push({ type: 'PERMISSIONS_CHANGED', message: 'Permissões de um funcionário foram alteradas', actor: l.actor, createdAt: l.createdAt });
    }
    for (const l of exports) {
      alerts.push({
        type: 'DATA_EXPORT',
        message: `Exportação de ${l.entityId ?? '?'} registo(s) de ${l.entity ?? 'dados'}`,
        actor: l.actor,
        createdAt: l.createdAt,
      });
    }
    for (const l of newDevices) {
      alerts.push({ type: 'NEW_DEVICE', message: 'Acesso administrativo a partir de um novo dispositivo', actor: l.actor, createdAt: l.createdAt });
    }

    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 100);
  }
}
