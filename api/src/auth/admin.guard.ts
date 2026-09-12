import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from './current-user.decorator.js';

// Corre sempre depois do JwtAuthGuard (que já validou o token e preencheu
// request.user) — aqui só falta confirmar que é mesmo uma conta de admin.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito a administradores');
    }
    return true;
  }
}
