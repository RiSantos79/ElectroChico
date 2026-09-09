import { CanActivate, ExecutionContext, HttpException, HttpStatus, Type } from '@nestjs/common';
import type { Request } from 'express';

// ponytail: contador em memória, por instância — reinicia em cada deploy/restart
// e não é partilhado entre várias instâncias. Suficiente para o único serviço
// do Render agora; se algum dia houver múltiplas instâncias, passar para Redis.
export function RateLimit(options: { windowMs: number; max: number }): Type<CanActivate> {
  const hits = new Map<string, { count: number; resetAt: number }>();

  class RateLimitGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest<Request>();
      const key = req.ip ?? 'unknown';
      const now = Date.now();
      const entry = hits.get(key);

      if (!entry || now > entry.resetAt) {
        hits.set(key, { count: 1, resetAt: now + options.windowMs });
        return true;
      }

      if (entry.count >= options.max) {
        throw new HttpException('Demasiados pedidos. Tenta novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
      }

      entry.count += 1;
      return true;
    }
  }

  return RateLimitGuard;
}
