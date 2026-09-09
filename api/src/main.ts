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
