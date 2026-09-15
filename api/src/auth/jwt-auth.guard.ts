import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from './current-user.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // Vai sempre à base de dados em vez de confiar só no que está no JWT — uma
  // suspensão/desativação ou alteração de role/permissões tem de ter efeito
  // imediato, não só depois do token expirar.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Sessão não autenticada');

    let payload: { sub: string; mfaPending?: boolean };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    if (payload.mfaPending) throw new UnauthorizedException('Sessão inválida ou expirada');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Sessão inválida ou expirada');

    request.user = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      permissionOverrides: user.permissionOverrides,
      name: user.name,
    };
    return true;
  }
}
