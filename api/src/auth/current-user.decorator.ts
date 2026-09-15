import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Role, UserStatus } from '../generated/prisma/client.js';

export type AuthenticatedUser = {
  sub: string;
  sessionId: string;
  email: string;
  role: Role;
  status: UserStatus;
  permissionOverrides: unknown;
  name?: string | null;
};

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
  return request.user;
});
