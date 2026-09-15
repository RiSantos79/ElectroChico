import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from './current-user.decorator.js';

const SESSION_TOUCH_INTERVAL_MS = 60_000;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // Vai sempre à base de dados em vez de confiar só no que está no JWT — uma
  // suspensão/desativação, alteração de role/permissões ou encerramento de
  // sessão tem de ter efeito imediato, não só depois do token expirar.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Sessão não autenticada');

    let payload: { sub: string; mfaPending?: boolean; sessionId?: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    if (payload.mfaPending || !payload.sessionId) throw new UnauthorizedException('Sessão inválida ou expirada');

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.userId !== payload.sub) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    const user = session.user;
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Sessão inválida ou expirada');

    if (Date.now() - session.lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS) {
      this.prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
    }

    request.user = {
      sub: user.id,
      sessionId: session.id,
      email: user.email,
      role: user.role,
      status: user.status,
      permissionOverrides: user.permissionOverrides,
      name: user.name,
    };
    return true;
  }
}
