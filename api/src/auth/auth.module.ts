import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../email/email.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { PermissionsGuard } from './permissions.guard.js';
import { StaffGuard } from './staff.guard.js';
import { SuperAdminGuard } from './super-admin.guard.js';

@Module({
  imports: [
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PermissionsGuard, StaffGuard, SuperAdminGuard],
  exports: [JwtModule, JwtAuthGuard, PermissionsGuard, StaffGuard, SuperAdminGuard, AuthService],
})
export class AuthModule {}
