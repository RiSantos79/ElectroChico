import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import type { Role, User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { encryptSecret, decryptSecret } from '../common/mfa-crypto.js';
import { generateRecoveryCodes } from '../common/recovery-codes.js';

const MFA_TOKEN_TTL = '5m';
const MFA_SETUP_TOKEN_TTL = '10m';
const REAUTH_TOKEN_TTL = '10m';
const MFA_REQUIRED_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN'];
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      await this.audit.log('LOGIN_BLOCKED_LOCKOUT', { actor: email, ip });
      throw new UnauthorizedException(
        `Conta temporariamente bloqueada por demasiadas tentativas falhadas. Tente novamente às ${user.lockedUntil.toLocaleTimeString('pt-PT')}.`,
      );
    }

    // Verifica sempre um hash (mesmo que dummy) para não revelar por timing se o email existe.
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const valid = await argon2.verify(hash, password).catch(() => false);

    if (!user || !valid) {
      if (user) await this.registerFailedAttempt(user);
      await this.audit.log('LOGIN_FAILED', { actor: email, ip });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== 'ACTIVE') {
      await this.audit.log('LOGIN_BLOCKED', { actor: email, ip });
      throw new UnauthorizedException(
        user.status === 'SUSPENDED' ? 'Conta suspensa — contacte um administrador.' : 'Conta desativada.',
      );
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    }

    if (user.mfaEnabled) {
      // Token de curta duração e sem "role" — não serve para aceder a nada,
      // só para provar que a password já foi validada quando se chamar
      // /auth/mfa/verify a seguir. A sessão só é criada nesse passo final.
      const mfaToken = await this.jwt.signAsync({ sub: user.id, mfaPending: true }, { expiresIn: MFA_TOKEN_TTL });
      return { mfaRequired: true, mfaToken };
    }

    if (MFA_REQUIRED_ROLES.includes(user.role)) {
      // SUPER_ADMIN/ADMIN sem MFA ainda ativo: em vez de bloquear o acesso
      // (não haveria forma de o ativar), força a configuração aqui mesmo,
      // com um token de curta duração que só serve para esse fim.
      const mfaSetupToken = await this.jwt.signAsync({ sub: user.id, mfaSetupPending: true }, { expiresIn: MFA_SETUP_TOKEN_TTL });
      return { mfaSetupRequired: true, mfaSetupToken };
    }

    await this.recordLogin(user.id, email, ip);
    const accessToken = await this.issueToken(user, ip, userAgent);
    return { accessToken };
  }

  private async registerFailedAttempt(user: User) {
    const attempts = user.failedLoginAttempts + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) },
      });
      return;
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts } });
  }

  private async recordLogin(userId: string, email: string, ip?: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date(), lastLoginIp: ip } });
    await this.audit.log('LOGIN_SUCCESS', { actor: email, ip });
  }

  // Cria uma sessão nova (visível em "Sessões ativas") e assina um token que
  // a referencia — revogar a sessão invalida o token de imediato, mesmo que
  // ainda não tenha expirado.
  private async issueToken(user: User, ip?: string, userAgent?: string) {
    const session = await this.prisma.session.create({ data: { userId: user.id, ip, userAgent } });
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      sessionId: session.id,
    });
  }

  // Reemite o token com dados atualizados (ex. nome mudou) sem criar uma
  // sessão nova — continua a ser a mesma sessão do ponto de vista do utilizador.
  private async reissueToken(user: User, sessionId: string) {
    return this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role, name: user.name, sessionId });
  }

  async verifyMfa(mfaToken: string, code: string, ip?: string, userAgent?: string) {
    let payload: { sub: string; mfaPending?: boolean };
    try {
      payload = await this.jwt.verifyAsync(mfaToken);
    } catch {
      throw new UnauthorizedException('Sessão de verificação inválida ou expirada — inicie sessão novamente.');
    }
    if (!payload.mfaPending) throw new UnauthorizedException('Token inválido para este passo.');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.mfaEnabled || !user.mfaSecretEncrypted) {
      throw new UnauthorizedException('Conta sem verificação em duas etapas ativa.');
    }
    if (user.status !== 'ACTIVE') {
      await this.audit.log('LOGIN_BLOCKED', { actor: user.email, ip });
      throw new UnauthorizedException(
        user.status === 'SUSPENDED' ? 'Conta suspensa — contacte um administrador.' : 'Conta desativada.',
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const isTotpValid = authenticator.check(code.trim(), decryptSecret(user.mfaSecretEncrypted));

    if (!isTotpValid) {
      const matchedRecoveryCode = await this.consumeRecoveryCode(user.id, user.mfaRecoveryCodes, normalizedCode);
      if (!matchedRecoveryCode) {
        await this.audit.log('LOGIN_FAILED', { actor: user.email, ip });
        throw new UnauthorizedException('Código inválido.');
      }
    }

    await this.recordLogin(user.id, user.email, ip);
    const accessToken = await this.issueToken(user, ip, userAgent);
    return { accessToken };
  }

  private async consumeRecoveryCode(userId: string, hashedCodes: string[], candidate: string): Promise<boolean> {
    for (const hashed of hashedCodes) {
      if (await argon2.verify(hashed, candidate).catch(() => false)) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { mfaRecoveryCodes: hashedCodes.filter((h) => h !== hashed) },
        });
        return true;
      }
    }
    return false;
  }

  async getMfaStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return { enabled: user.mfaEnabled, recoveryCodesRemaining: user.mfaRecoveryCodes.length };
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    if (user.mfaEnabled) {
      throw new BadRequestException('A verificação em duas etapas já está ativa — desative-a primeiro para a reconfigurar.');
    }

    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { mfaSecretEncrypted: encryptSecret(secret) } });

    const otpauthUrl = authenticator.keyuri(user.email, 'ElectroChico', secret);
    return { secret, otpauthUrl };
  }

  async enableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    if (user.mfaEnabled) throw new BadRequestException('A verificação em duas etapas já está ativa.');
    if (!user.mfaSecretEncrypted) {
      throw new BadRequestException('Nenhuma configuração pendente — comece por gerar um código QR.');
    }

    const isValid = authenticator.check(code.trim(), decryptSecret(user.mfaSecretEncrypted));
    if (!isValid) throw new UnauthorizedException('Código inválido.');

    const recoveryCodes = generateRecoveryCodes();
    const hashedCodes = await Promise.all(recoveryCodes.map((c) => argon2.hash(c)));
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaRecoveryCodes: hashedCodes },
    });
    await this.audit.log('MFA_ENABLED', { actor: user.email });
    return { recoveryCodes };
  }

  // --- Configuração de MFA obrigatória no próprio login (SUPER_ADMIN/ADMIN
  // sem MFA ainda ativo) — usa um token de curta duração em vez de uma sessão
  // normal, porque a conta ainda não cumpre o requisito para ter uma.

  async setupMfaWithToken(mfaSetupToken: string) {
    const { sub } = await this.verifyMfaSetupToken(mfaSetupToken);
    return this.setupMfa(sub);
  }

  async enableMfaWithToken(mfaSetupToken: string, code: string, ip?: string, userAgent?: string) {
    const { sub } = await this.verifyMfaSetupToken(mfaSetupToken);
    const { recoveryCodes } = await this.enableMfa(sub, code);
    const user = await this.prisma.user.findUnique({ where: { id: sub } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    await this.recordLogin(user.id, user.email, ip);
    const accessToken = await this.issueToken(user, ip, userAgent);
    return { accessToken, recoveryCodes };
  }

  private async verifyMfaSetupToken(token: string): Promise<{ sub: string }> {
    let payload: { sub: string; mfaSetupPending?: boolean };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Sessão de configuração inválida ou expirada — inicie sessão novamente.');
    }
    if (!payload.mfaSetupPending) throw new UnauthorizedException('Token inválido para este passo.');
    return payload;
  }

  async disableMfa(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');

    const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!valid) throw new UnauthorizedException('Palavra-passe incorreta');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecretEncrypted: null, mfaRecoveryCodes: [] },
    });
    await this.audit.log('MFA_DISABLED', { actor: user.email });
  }

  async register(email: string, password: string, name: string, ip?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Já existe uma conta com este email');

    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name, role: 'CUSTOMER' },
    });

    const accessToken = await this.issueToken(user, ip, userAgent);
    return { accessToken };
  }

  async updateName(userId: string, name: string, sessionId: string) {
    const user = await this.prisma.user.update({ where: { id: userId }, data: { name } });
    const accessToken = await this.reissueToken(user, sessionId);
    return { accessToken };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');

    const valid = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
    if (!valid) throw new UnauthorizedException('Palavra-passe atual incorreta');

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  // --- Sessões ---

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: 'desc' },
    });
    return sessions.map((s) => ({ ...s, current: s.id === currentSessionId }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new NotFoundException('Sessão não encontrada');
    if (session.revokedAt) return;
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  async revokeOtherSessions(userId: string, currentSessionId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, id: { not: currentSessionId } },
      data: { revokedAt: new Date() },
    });
  }

  // --- Confirmação de ações críticas ---
  // Reintroduzir a password (+ código MFA, se ativo) devolve um token de
  // curta duração que prova "confirmei mesmo agora que sou eu". As ações
  // sensíveis (apagar produto, mudar permissões, criar administrador) exigem
  // este token, sem ele nunca prosseguem — mesmo com uma sessão válida.
  async reauth(userId: string, password: string, code?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');

    const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!valid) throw new UnauthorizedException('Palavra-passe incorreta.');

    if (user.mfaEnabled) {
      if (!user.mfaSecretEncrypted || !code || !authenticator.check(code.trim(), decryptSecret(user.mfaSecretEncrypted))) {
        throw new UnauthorizedException('Código de verificação inválido.');
      }
    }

    const reauthToken = await this.jwt.signAsync({ sub: user.id, reauthPending: true }, { expiresIn: REAUTH_TOKEN_TTL });
    return { reauthToken };
  }

  async verifyReauthToken(userId: string, reauthToken?: string): Promise<void> {
    if (!reauthToken) throw new ForbiddenException('Esta ação requer confirmação adicional.');
    let payload: { sub: string; reauthPending?: boolean };
    try {
      payload = await this.jwt.verifyAsync(reauthToken);
    } catch {
      throw new ForbiddenException('Esta ação requer confirmação adicional.');
    }
    if (!payload.reauthPending || payload.sub !== userId) {
      throw new ForbiddenException('Esta ação requer confirmação adicional.');
    }
  }
}

// Hash Argon2 real (de uma password aleatória fixa), só para igualar o tempo de
// resposta quando o email não existe — sem isto, o tempo de resposta revelaria
// se um email está ou não registado (não teria de fazer o cálculo do Argon2).
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$YfPNBv4gol2Yde1Xazq6YA$0OnBahQDid2LfgpJpTC5T8pMTuClXn0TjJkIe38raFE';
