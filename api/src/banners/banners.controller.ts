import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BannersService } from './banners.service.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';
import { UpdateBannerDto } from './dto/update-banner.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  findActive() {
    return this.bannersService.findActive();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('configuracoes', 'view')
  @Get('all')
  findAll() {
    return this.bannersService.findAll();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('configuracoes', 'create')
  @Post()
  create(@Body() dto: CreateBannerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bannersService.create(dto, user.email);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('configuracoes', 'edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bannersService.update(id, dto, user.email);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('configuracoes', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bannersService.remove(id, user.email);
  }
}
