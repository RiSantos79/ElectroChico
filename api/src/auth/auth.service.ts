import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Verifica sempre um hash (mesmo que dummy) para não revelar por timing se o email existe.
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const valid = await argon2.verify(hash, password).catch(() => false);

    if (!user || !valid) {
      await this.audit.log('LOGIN_FAILED', { actor: email, ip });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.audit.log('LOGIN_SUCCESS', { actor: email, ip });
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role, name: user.name });
    return { accessToken };
  }

  async register(email: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Já existe uma conta com este email');

    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name, role: 'CUSTOMER' },
    });

    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role, name: user.name });
    return { accessToken };
  }
}

// Hash Argon2 real (de uma password aleatória fixa), só para igualar o tempo de
// resposta quando o email não existe — sem isto, o tempo de resposta revelaria
// se um email está ou não registado (não teria de fazer o cálculo do Argon2).
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$YfPNBv4gol2Yde1Xazq6YA$0OnBahQDid2LfgpJpTC5T8pMTuClXn0TjJkIe38raFE';
