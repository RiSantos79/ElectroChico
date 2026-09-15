import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from './current-user.decorator.js';

// Para endpoints partilhados por vários módulos (ex. upload de imagens, usado
// por produtos/marcas/categorias/banners) onde não faz sentido exigir uma
// permissão de um módulo específico — basta confirmar que é conta de staff.
@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user || request.user.role === 'CUSTOMER') {
      throw new ForbiddenException('Acesso restrito a contas de staff');
    }
    return true;
  }
}
