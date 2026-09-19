import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// Limiares da deteção. Ficam aqui, no servidor, e não numa definição editável:
// baixá-los pela interface seria uma forma silenciosa de cegar o alarme.
const JANELA_MINUTOS = 30;
// Password spraying: poucas tentativas em muitas contas, para não disparar o
// bloqueio de nenhuma. É o padrão oposto ao do brute force.
const SPRAY_MIN_FALHAS = 6;
const SPRAY_MIN_CONTAS = 3;
// Brute force: insistência numa só conta.
const BRUTE_FORCE_MIN_FALHAS = 5;

const ACOES_DE_FALHA = ['LOGIN_FAILED', 'LOGIN_BLOCKED_LOCKOUT'];

export type AuthThreatReport = {
  janelaMinutos: number;
  nivel: 'OK' | 'AVISO' | 'ALERTA';
  totalFalhas: number;
  contasAfetadas: number;
  porConta: { email: string; falhas: number; bloqueada: boolean }[];
  ipsDistintos: number;
  topIps: { ip: string; falhas: number }[];
  // Tentativas contra emails que não existem: não se conseguem atribuir ao
  // backoffice, mas é a assinatura típica de quem experimenta admin@, root@...
  falhasContaDesconhecida: number;
  limiares: { sprayFalhas: number; sprayContas: number; bruteForceFalhas: number };
};

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

  // Olha para as falhas de autenticação recentes e diz se o padrão parece um
  // ataque. Só conta contas de backoffice: falhas de clientes na loja são
  // ruído para quem vigia o acesso administrativo.
  async authThreats(): Promise<AuthThreatReport> {
    const desde = new Date(Date.now() - JANELA_MINUTOS * 60_000);

    const falhas = await this.prisma.auditLog.findMany({
      where: { action: { in: ACOES_DE_FALHA }, createdAt: { gte: desde }, actor: { not: null } },
      select: { actor: true, ip: true },
    });

    const emails = [...new Set(falhas.map((f) => f.actor).filter((a): a is string => Boolean(a)))];
    const staff = await this.prisma.user.findMany({
      where: { email: { in: emails }, role: { not: 'CUSTOMER' } },
      select: { email: true, lockedUntil: true },
    });
    const staffPorEmail = new Map(staff.map((u) => [u.email, u]));

    // Um email que não pertence a ninguém não é um cliente nem é staff — é
    // alguém a adivinhar nomes de conta.
    const conhecidos = await this.prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    const existentes = new Set(conhecidos.map((u) => u.email));

    const porConta = new Map<string, number>();
    const porIp = new Map<string, number>();
    let falhasContaDesconhecida = 0;

    for (const falha of falhas) {
      const email = falha.actor!;
      if (staffPorEmail.has(email)) {
        porConta.set(email, (porConta.get(email) ?? 0) + 1);
        if (falha.ip) porIp.set(falha.ip, (porIp.get(falha.ip) ?? 0) + 1);
      } else if (!existentes.has(email)) {
        falhasContaDesconhecida += 1;
      }
    }

    const contas = [...porConta.entries()]
      .map(([email, falhas]) => ({
        email,
        falhas,
        bloqueada: Boolean(staffPorEmail.get(email)?.lockedUntil && staffPorEmail.get(email)!.lockedUntil! > new Date()),
      }))
      .sort((a, b) => b.falhas - a.falhas);

    const totalFalhas = contas.reduce((soma, c) => soma + c.falhas, 0);
    const spraying = totalFalhas >= SPRAY_MIN_FALHAS && contas.length >= SPRAY_MIN_CONTAS;
    const bruteForce = contas.some((c) => c.falhas >= BRUTE_FORCE_MIN_FALHAS);

    return {
      janelaMinutos: JANELA_MINUTOS,
      nivel: spraying || bruteForce ? 'ALERTA' : totalFalhas > 0 ? 'AVISO' : 'OK',
      totalFalhas,
      contasAfetadas: contas.length,
      porConta: contas.slice(0, 10),
      ipsDistintos: porIp.size,
      topIps: [...porIp.entries()]
        .map(([ip, falhas]) => ({ ip, falhas }))
        .sort((a, b) => b.falhas - a.falhas)
        .slice(0, 5),
      falhasContaDesconhecida,
      limiares: {
        sprayFalhas: SPRAY_MIN_FALHAS,
        sprayContas: SPRAY_MIN_CONTAS,
        bruteForceFalhas: BRUTE_FORCE_MIN_FALHAS,
      },
    };
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
