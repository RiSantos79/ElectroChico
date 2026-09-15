import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ContentPagesService } from './content-pages.service.js';
import { UpdateContentPageDto } from './dto/update-content-page.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('content-pages')
export class ContentPagesController {
  constructor(private readonly contentPagesService: ContentPagesService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('configuracoes', 'view')
  @Get()
  findAll() {
    return this.contentPagesService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.contentPagesService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('configuracoes', 'edit')
  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateContentPageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.contentPagesService.update(slug, dto, user.email);
  }
}
