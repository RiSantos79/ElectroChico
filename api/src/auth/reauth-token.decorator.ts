import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// Lê o cabeçalho X-Reauth-Token — a prova de que a password (e MFA, se
// ativo) foi reintroduzida mesmo agora, exigida em ações críticas.
export const ReauthToken = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const header = request.headers['x-reauth-token'];
  return Array.isArray(header) ? header[0] : header;
});
