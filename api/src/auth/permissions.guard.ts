import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { hasPermission, type Action, type Module } from '../common/permissions.js';
import { PERMISSION_KEY } from './require-permission.decorator.js';
import type { AuthenticatedUser } from './current-user.decorator.js';

// Corre sempre depois do JwtAuthGuard, que já buscou o utilizador atual à
// base de dados (role + permissionOverrides), não confia no que estava no
// JWT — assim uma alteração de permissões ou suspensão tem efeito imediato.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.get<{ module: Module; action: Action } | undefined>(PERMISSION_KEY, context.getHandler()) ??
      this.reflector.get<{ module: Module; action: Action } | undefined>(PERMISSION_KEY, context.getClass());
    if (!required) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user || !hasPermission(user, required.module, required.action)) {
      throw new ForbiddenException('Sem permissão para esta ação');
    }
    return true;
  }
}
