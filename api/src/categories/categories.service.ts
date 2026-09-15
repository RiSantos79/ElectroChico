import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateCategoryDto, actorEmail?: string) {
    const category = await this.prisma.category.create({ data: dto });
    await this.audit.log('CATEGORY_CREATE', { entity: 'Category', entityId: category.id, actor: actorEmail });
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, actorEmail?: string) {
    const category = await this.prisma.category.update({ where: { id }, data: dto });
    await this.audit.log('CATEGORY_UPDATE', { entity: 'Category', entityId: id, actor: actorEmail });
    return category;
  }
}
