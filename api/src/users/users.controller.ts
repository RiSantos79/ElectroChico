import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';

@Controller('users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAllCustomers() {
    return this.usersService.findAllCustomers();
  }

  @Get(':id')
  findCustomerDetail(@Param('id') id: string) {
    return this.usersService.findCustomerDetail(id);
  }
}
