import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpsertAddressDto } from './dto/upsert-address.dto.js';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(customerId: string) {
    return this.prisma.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(customerId: string, dto: UpsertAddressDto) {
    if (dto.isDefault) await this.clearDefault(customerId);
    return this.prisma.address.create({ data: { ...dto, customerId } });
  }

  async update(customerId: string, id: string, dto: UpsertAddressDto) {
    await this.ensureOwnership(customerId, id);
    if (dto.isDefault) await this.clearDefault(customerId);
    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async remove(customerId: string, id: string) {
    await this.ensureOwnership(customerId, id);
    await this.prisma.address.delete({ where: { id } });
  }

  private async ensureOwnership(customerId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Morada não encontrada');
    if (address.customerId !== customerId) throw new ForbiddenException('Esta morada não é sua');
  }

  private clearDefault(customerId: string) {
    return this.prisma.address.updateMany({ where: { customerId, isDefault: true }, data: { isDefault: false } });
  }
}
