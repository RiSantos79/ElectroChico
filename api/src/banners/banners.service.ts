import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';
import { UpdateBannerDto } from './dto/update-banner.dto.js';

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findActive() {
    return this.prisma.banner.findMany({ where: { active: true }, orderBy: { order: 'asc' } });
  }

  findAll() {
    return this.prisma.banner.findMany({ orderBy: { order: 'asc' } });
  }

  async create(dto: CreateBannerDto, actorEmail?: string) {
    if (dto.order === undefined) {
      const last = await this.prisma.banner.findFirst({ orderBy: { order: 'desc' } });
      dto.order = (last?.order ?? -1) + 1;
    }
    const banner = await this.prisma.banner.create({ data: dto });
    await this.audit.log('BANNER_CREATE', { entity: 'Banner', entityId: banner.id, actor: actorEmail });
    return banner;
  }

  async update(id: string, dto: UpdateBannerDto, actorEmail?: string) {
    await this.ensureExists(id);
    const banner = await this.prisma.banner.update({ where: { id }, data: dto });
    await this.audit.log('BANNER_UPDATE', { entity: 'Banner', entityId: id, actor: actorEmail });
    return banner;
  }

  async remove(id: string, actorEmail?: string) {
    await this.ensureExists(id);
    await this.prisma.banner.delete({ where: { id } });
    await this.audit.log('BANNER_DELETE', { entity: 'Banner', entityId: id, actor: actorEmail });
  }

  private async ensureExists(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException(`Banner com id "${id}" não encontrado`);
  }
}
