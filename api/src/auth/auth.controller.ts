import { Body, Controller, Delete, Get, HttpCode, Param, Post, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { MfaVerifyDto } from './dto/mfa-verify.dto.js';
import { MfaEnableDto } from './dto/mfa-enable.dto.js';
import { MfaDisableDto } from './dto/mfa-disable.dto.js';
import { MfaSetupRequiredDto } from './dto/mfa-setup-required.dto.js';
import { MfaEnableRequiredDto } from './dto/mfa-enable-required.dto.js';
import { ReauthDto } from './dto/reauth.dto.js';
import { RateLimit } from '../common/rate-limit.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { CurrentUser, type AuthenticatedUser } from './current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(RateLimit({ windowMs: 60_000, max: 5 }))
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto.email, dto.password, req.ip, req.headers['user-agent']);
  }

  @Post('mfa/verify')
  @HttpCode(200)
  @UseGuards(RateLimit({ windowMs: 60_000, max: 10 }))
  verifyMfa(@Body() dto: MfaVerifyDto, @Req() req: Request) {
    return this.authService.verifyMfa(dto.mfaToken, dto.code, req.ip, req.headers['user-agent']);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mfa/status')
  getMfaStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMfaStatus(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  setupMfa(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.setupMfa(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  enableMfa(@Body() dto: MfaEnableDto, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.enableMfa(user.sub, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  @HttpCode(200)
  async disableMfa(@Body() dto: MfaDisableDto, @CurrentUser() user: AuthenticatedUser) {
    await this.authService.disableMfa(user.sub, dto.password);
    return { ok: true };
  }

  // Passo intermédio quando o login exige MFA obrigatório (SUPER_ADMIN/ADMIN)
  // mas a conta ainda não o tem configurado — usa o mfaSetupToken devolvido
  // por /auth/login em vez de uma sessão normal.
  @Post('mfa/setup-required')
  @HttpCode(200)
  @UseGuards(RateLimit({ windowMs: 60_000, max: 10 }))
  setupMfaRequired(@Body() dto: MfaSetupRequiredDto) {
    return this.authService.setupMfaWithToken(dto.mfaSetupToken);
  }

  @Post('mfa/enable-required')
  @HttpCode(200)
  @UseGuards(RateLimit({ windowMs: 60_000, max: 10 }))
  enableMfaRequired(@Body() dto: MfaEnableRequiredDto, @Req() req: Request) {
    return this.authService.enableMfaWithToken(dto.mfaSetupToken, dto.code, req.ip, req.headers['user-agent']);
  }

  @Post('register')
  @HttpCode(201)
  @UseGuards(RateLimit({ windowMs: 60_000, max: 5 }))
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto.email, dto.password, dto.name, req.ip, req.headers['user-agent']);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.updateName(user.sub, dto.name, user.sessionId);
  }

  @Post('reauth')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RateLimit({ windowMs: 60_000, max: 10 }))
  reauth(@Body() dto: ReauthDto, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.reauth(user.sub, dto.password, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(200)
  async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: AuthenticatedUser) {
    await this.authService.changePassword(user.sub, dto.currentPassword, dto.newPassword);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listSessions(user.sub, user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @HttpCode(200)
  async revokeSession(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.authService.revokeSession(user.sub, id);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke-others')
  @HttpCode(200)
  async revokeOtherSessions(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.revokeOtherSessions(user.sub, user.sessionId);
    return { ok: true };
  }
}
