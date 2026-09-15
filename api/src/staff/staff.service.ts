import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthService } from '../auth/auth.service.js';
import { ACTIONS, effectivePermissions, MODULES } from '../common/permissions.js';
import type { Role } from '../generated/prisma/client.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { UpdatePermissionsDto } from './dto/update-permissions.dto.js';

const ADMIN_TIER_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN'];

const SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  jobTitle: true,
  role: true,
  status: true,
  permissionOverrides: true,
  lastLoginAt: true,
  lastLoginIp: true,
  mfaEnabled: true,
  createdAt: true,
} as const;

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { role: { not: 'CUSTOMER' } },
      select: SAFE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    return users.map(withEffectivePermissions);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, role: { not: 'CUSTOMER' } }, select: SAFE_SELECT });
    if (!user) throw new NotFoundException('Funcionário não encontrado');
    return withEffectivePermissions(user);
  }

  async create(dto: CreateStaffDto, actorId: string, actorEmail?: string, reauthToken?: string) {
    if (dto.role === 'CUSTOMER') throw new BadRequestException('Role inválida para um funcionário');
    // Criar um administrador (SUPER_ADMIN/ADMIN) é uma ação crítica — criar
    // funcionários de outras roles não exige esta confirmação extra.
    if (ADMIN_TIER_ROLES.includes(dto.role)) {
      await this.auth.verifyReauthToken(actorId, reauthToken);
    }
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Já existe uma conta com este email');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        jobTitle: dto.jobTitle,
        role: dto.role,
      },
      select: SAFE_SELECT,
    });
    await this.audit.log('STAFF_CREATE', { entity: 'User', entityId: user.id, actor: actorEmail });
    return withEffectivePermissions(user);
  }

  async update(id: string, dto: UpdateStaffDto, actorId: string, actorEmail?: string, reauthToken?: string) {
    const before = await this.ensureStaff(id);
    if (dto.role === 'CUSTOMER') throw new BadRequestException('Role inválida para um funcionário');
    // Promover alguém a SUPER_ADMIN/ADMIN é equivalente a criar um
    // administrador — exige a mesma confirmação, mesmo vindo de uma edição.
    if (dto.role && ADMIN_TIER_ROLES.includes(dto.role) && dto.role !== before.role) {
      await this.auth.verifyReauthToken(actorId, reauthToken);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { name: dto.name, phone: dto.phone, jobTitle: dto.jobTitle, role: dto.role },
      select: SAFE_SELECT,
    });
    await this.audit.log('STAFF_UPDATE', { entity: 'User', entityId: id, actor: actorEmail });
    if (dto.role && dto.role !== before.role) {
      await this.audit.log('ROLE_CHANGED', { entity: 'User', entityId: id, actor: actorEmail });
    }
    return withEffectivePermissions(user);
  }

  async updateStatus(id: string, dto: UpdateStatusDto, actorEmail?: string, currentUserId?: string) {
    await this.ensureStaff(id);
    if (id === currentUserId && dto.status !== 'ACTIVE') {
      throw new ForbiddenException('Não pode suspender ou desativar a sua própria conta');
    }
    const user = await this.prisma.user.update({ where: { id }, data: { status: dto.status }, select: SAFE_SELECT });
    await this.audit.log(`STAFF_STATUS_${dto.status}`, { entity: 'User', entityId: id, actor: actorEmail });
    return withEffectivePermissions(user);
  }

  async updatePermissions(id: string, dto: UpdatePermissionsDto, actorId: string, actorEmail?: string, reauthToken?: string) {
    await this.auth.verifyReauthToken(actorId, reauthToken);
    await this.ensureStaff(id);
    if (dto.overrides != null) {
      this.validatePermissionMatrix(dto.overrides);
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: { permissionOverrides: dto.overrides ?? Prisma.JsonNull },
      select: SAFE_SELECT,
    });
    await this.audit.log('PERMISSIONS_CHANGED', { entity: 'User', entityId: id, actor: actorEmail });
    return withEffectivePermissions(user);
  }

  async forcePasswordReset(id: string, actorEmail?: string) {
    await this.ensureStaff(id);
    const tempPassword = this.generateTempPassword();
    const passwordHash = await argon2.hash(tempPassword);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    await this.revokeAllSessions(id);
    await this.audit.log('PASSWORD_RESET_FORCED', { entity: 'User', entityId: id, actor: actorEmail });
    return { tempPassword };
  }

  async forceLogout(id: string, actorEmail?: string) {
    await this.ensureStaff(id);
    await this.revokeAllSessions(id);
    await this.audit.log('FORCE_LOGOUT', { entity: 'User', entityId: id, actor: actorEmail });
  }

  listSessions(id: string) {
    return this.prisma.session.findMany({
      where: { userId: id, revokedAt: null },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  private revokeAllSessions(userId: string) {
    return this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async remove(id: string, actorEmail?: string, currentUserId?: string) {
    await this.ensureStaff(id);
    if (id === currentUserId) throw new ForbiddenException('Não pode eliminar a sua própria conta');
    await this.prisma.user.delete({ where: { id } });
    await this.audit.log('STAFF_DELETE', { entity: 'User', entityId: id, actor: actorEmail });
  }

  private async ensureStaff(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, role: { not: 'CUSTOMER' } } });
    if (!user) throw new NotFoundException('Funcionário não encontrado');
    return user;
  }

  private validatePermissionMatrix(overrides: Record<string, Record<string, boolean>>) {
    for (const moduleKey of Object.keys(overrides)) {
      if (!(MODULES as readonly string[]).includes(moduleKey)) {
        throw new BadRequestException(`Módulo desconhecido: ${moduleKey}`);
      }
      for (const actionKey of Object.keys(overrides[moduleKey])) {
        if (!(ACTIONS as readonly string[]).includes(actionKey)) {
          throw new BadRequestException(`Ação desconhecida: ${actionKey}`);
        }
      }
    }
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}

// A interface de permissões precisa sempre da matriz completa (16 módulos x
// 5 ações) já resolvida — sem isto teria de duplicar ROLE_DEFAULTS no
// frontend só para saber o que mostrar quando não há personalização.
function withEffectivePermissions<T extends { role: import('../generated/prisma/client.js').Role; permissionOverrides: unknown }>(
  user: T,
) {
  return { ...user, effectivePermissions: effectivePermissions(user) };
}
