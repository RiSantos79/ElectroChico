import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { slugify } from '../common/slugify.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const brands = await this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return brands.map((b) => ({ ...b, productCount: b._count.products, _count: undefined }));
  }

  async findBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand) throw new NotFoundException(`Marca "${slug}" não encontrada`);
    return brand;
  }

  async create(dto: CreateBrandDto) {
    const slug = slugify(dto.name);
    if (await this.prisma.brand.findUnique({ where: { slug } })) {
      throw new ConflictException(`Já existe uma marca com o nome "${dto.name}"`);
    }
    return this.prisma.brand.create({ data: { ...dto, slug } });
  }

  async update(id: string, dto: UpdateBrandDto) {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Marca com id "${id}" não encontrada`);

    const slug = dto.name ? slugify(dto.name) : undefined;
    if (slug && slug !== existing.slug) {
      const collision = await this.prisma.brand.findUnique({ where: { slug } });
      if (collision) throw new ConflictException(`Já existe uma marca com o nome "${dto.name}"`);
    }
    return this.prisma.brand.update({ where: { id }, data: { ...dto, slug } });
  }
}
