import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';

// Este controller é o módulo "Clientes" do backoffice (lista compradores da
// loja) — não confundir com a gestão de funcionários/staff, que é um módulo
// à parte ("Utilizadores").
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('clientes', 'view')
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
