import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service.js';
import { UpsertAddressDto } from './dto/upsert-address.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.addressesService.findMine(user.sub);
  }

  @Post()
  create(@Body() dto: UpsertAddressDto, @CurrentUser() user: AuthenticatedUser) {
    return this.addressesService.create(user.sub, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertAddressDto, @CurrentUser() user: AuthenticatedUser) {
    return this.addressesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.addressesService.remove(user.sub, id);
  }
}
