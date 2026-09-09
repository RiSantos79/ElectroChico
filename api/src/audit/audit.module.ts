import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';

// Global para que AuthService/ProductsService possam injetar o AuditService
// sem terem de importar este módulo (que, por sua vez, importa o AuthModule
// para proteger a rota de leitura — isso criaria um ciclo).
@Global()
@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
