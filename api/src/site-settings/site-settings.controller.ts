import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service.js';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  get() {
    return this.siteSettingsService.get();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('configuracoes', 'edit')
  @Patch()
  update(@Body() dto: UpdateSiteSettingsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.siteSettingsService.update(dto, user.email);
  }
}
