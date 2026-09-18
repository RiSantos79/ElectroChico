import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não está definido — configure-o no .env antes de arrancar a API.');
  }

  // O Stripe usa WEB_ORIGIN para construir o success_url. Se faltar, o cliente
  // paga e é devolvido a http://localhost:3001 — uma página morta que ninguém
  // repara em produção, por isso o aviso é gritado e não sussurrado.
  if (!process.env.WEB_ORIGIN && process.env.NODE_ENV === 'production') {
    console.error(
      '[ERRO DE CONFIGURAÇÃO] WEB_ORIGIN não está definido. O Stripe vai redirecionar ' +
        'os clientes para http://localhost:3001 depois do pagamento e o CORS só aceita ' +
        'esse endereço. Defina WEB_ORIGIN com o URL público da loja.',
    );
  }

  mkdirSync(join(process.cwd(), 'uploads'), { recursive: true });

  // bodyParser: false porque o webhook do Stripe precisa do corpo em bruto
  // (bytes exatos) para verificar a assinatura — o parser de JSON normal
  // já teria alterado/re-serializado o corpo antes de chegar ao controller.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.use('/webhooks/stripe', express.raw({ type: '*/*' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    helmet({
      // A API só serve JSON e imagens, nunca HTML — CSP por defeito do helmet
      // (pensada para servir páginas) não se aplica e pode ser desativada.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3333);
}
await bootstrap();
