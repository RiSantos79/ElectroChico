import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { UpdatePermissionsDto } from './dto/update-permissions.dto.js';
import { BulkDeleteStaffDto } from './dto/bulk-delete-staff.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { ReauthToken } from '../auth/reauth-token.decorator.js';

@Controller('staff')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @RequirePermission('utilizadores', 'view')
  @Get()
  findAll() {
    return this.staffService.findAll();
  }

  @RequirePermission('utilizadores', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @RequirePermission('utilizadores', 'view')
  @Get(':id/sessions')
  listSessions(@Param('id') id: string) {
    return this.staffService.listSessions(id);
  }

  @RequirePermission('utilizadores', 'create')
  @Post()
  create(@Body() dto: CreateStaffDto, @CurrentUser() user: AuthenticatedUser, @ReauthToken() reauthToken?: string) {
    return this.staffService.create(dto, user.sub, user.email, reauthToken);
  }

  @RequirePermission('utilizadores', 'edit')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: AuthenticatedUser,
    @ReauthToken() reauthToken?: string,
  ) {
    return this.staffService.update(id, dto, user.sub, user.email, reauthToken);
  }

  @RequirePermission('utilizadores', 'edit')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: AuthenticatedUser) {
    return this.staffService.updateStatus(id, dto, user.email, user.sub);
  }

  @RequirePermission('utilizadores', 'edit')
  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionsDto,
    @CurrentUser() user: AuthenticatedUser,
    @ReauthToken() reauthToken?: string,
  ) {
    return this.staffService.updatePermissions(id, dto, user.sub, user.email, reauthToken);
  }

  @RequirePermission('utilizadores', 'edit')
  @Post(':id/force-password-reset')
  forcePasswordReset(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.staffService.forcePasswordReset(id, user.email);
  }

  @RequirePermission('utilizadores', 'edit')
  @Post(':id/force-logout')
  forceLogout(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.staffService.forceLogout(id, user.email);
  }

  @RequirePermission('utilizadores', 'delete')
  @Delete('bulk')
  removeMany(@Body() dto: BulkDeleteStaffDto, @CurrentUser() user: AuthenticatedUser) {
    return this.staffService.removeMany(dto.ids, user.email, user.sub);
  }

  @RequirePermission('utilizadores', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.staffService.remove(id, user.email, user.sub);
  }
}
