import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service.js';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  get() {
    return this.siteSettingsService.get();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch()
  update(@Body() dto: UpdateSiteSettingsDto) {
    return this.siteSettingsService.update(dto);
  }
}
