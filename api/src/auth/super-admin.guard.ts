import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from './current-user.decorator.js';

// Para configuração sensível que nem os outros administradores devem poder
// mexer — hoje, as chaves de API da IA.
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (request.user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Acesso restrito a super administradores');
    }
    return true;
  }
}
