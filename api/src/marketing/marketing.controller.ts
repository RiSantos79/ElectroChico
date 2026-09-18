import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service.js';
import { UpdateMarketingSettingsDto } from './dto/update-marketing-settings.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { StaffGuard } from '../auth/staff.guard.js';
import { SuperAdminGuard } from '../auth/super-admin.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}

  // Estado é o suficiente para o staff ver avisos; configuração e chaves
  // ficam restritas a super administradores.
  @UseGuards(StaffGuard)
  @Get('status')
  status() {
    return this.marketing.status();
  }

  @UseGuards(SuperAdminGuard)
  @Get('settings')
  getSettings() {
    return this.marketing.getSettings();
  }

  @UseGuards(SuperAdminGuard)
  @Patch('settings')
  updateSettings(@Body() dto: UpdateMarketingSettingsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.marketing.updateSettings(dto, user.email);
  }

  @UseGuards(SuperAdminGuard)
  @Delete('settings/key')
  removeKey(@CurrentUser() user: AuthenticatedUser) {
    return this.marketing.removeApiKey(user.email);
  }

  @UseGuards(SuperAdminGuard)
  @Get('groups')
  groups() {
    return this.marketing.listGroups();
  }

  @UseGuards(SuperAdminGuard)
  @Post('sync')
  sync(@CurrentUser() user: AuthenticatedUser) {
    return this.marketing.syncAll(user.email);
  }
}
