import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';
import { UpdateBannerDto } from './dto/update-banner.dto.js';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  findActive() {
    return this.prisma.banner.findMany({ where: { active: true }, orderBy: { order: 'asc' } });
  }

  findAll() {
    return this.prisma.banner.findMany({ orderBy: { order: 'asc' } });
  }

  async create(dto: CreateBannerDto) {
    if (dto.order === undefined) {
      const last = await this.prisma.banner.findFirst({ orderBy: { order: 'desc' } });
      dto.order = (last?.order ?? -1) + 1;
    }
    return this.prisma.banner.create({ data: dto });
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.ensureExists(id);
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.banner.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException(`Banner com id "${id}" não encontrado`);
  }
}
