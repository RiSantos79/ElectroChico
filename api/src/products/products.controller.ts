import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('category') categorySlug?: string,
    @Query('brand') brandSlug?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.productsService.findAll({ categorySlug, brandSlug, includeArchived: includeArchived === 'true' });
  }

  @Get('by-id/:id')
  findOneById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get('search')
  search(@Query('q') q?: string) {
    return this.productsService.search(q ?? '');
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('produtos', 'create')
  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.create(dto, user.email);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('produtos', 'create')
  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.duplicate(id, user.email);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('produtos', 'edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.update(id, dto, user.email);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('produtos', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.remove(id, user.email);
  }
}
