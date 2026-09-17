import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { BulkDeleteBrandDto } from './dto/bulk-delete-brand.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.brandsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('marcas', 'create')
  @Post()
  create(@Body() dto: CreateBrandDto, @CurrentUser() user: AuthenticatedUser) {
    return this.brandsService.create(dto, user.email);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('marcas', 'edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto, @CurrentUser() user: AuthenticatedUser) {
    return this.brandsService.update(id, dto, user.email);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('marcas', 'delete')
  @Delete('bulk')
  removeMany(@Body() dto: BulkDeleteBrandDto, @CurrentUser() user: AuthenticatedUser) {
    return this.brandsService.removeMany(dto.ids, user.email);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('marcas', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.brandsService.remove(id, user.email);
  }
}
