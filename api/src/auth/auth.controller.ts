import { Body, Controller, Get, HttpCode, Post, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { MfaVerifyDto } from './dto/mfa-verify.dto.js';
import { MfaEnableDto } from './dto/mfa-enable.dto.js';
import { MfaDisableDto } from './dto/mfa-disable.dto.js';
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
    return this.authService.login(dto.email, dto.password, req.ip);
  }

  @Post('mfa/verify')
  @HttpCode(200)
  @UseGuards(RateLimit({ windowMs: 60_000, max: 10 }))
  verifyMfa(@Body() dto: MfaVerifyDto, @Req() req: Request) {
    return this.authService.verifyMfa(dto.mfaToken, dto.code, req.ip);
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

  @Post('register')
  @HttpCode(201)
  @UseGuards(RateLimit({ windowMs: 60_000, max: 5 }))
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.updateName(user.sub, dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(200)
  async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: AuthenticatedUser) {
    await this.authService.changePassword(user.sub, dto.currentPassword, dto.newPassword);
    return { ok: true };
  }
}
