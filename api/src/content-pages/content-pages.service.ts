import { NotFoundException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { sanitizeRichText } from '../common/sanitize-html.js';
import { UpdateContentPageDto } from './dto/update-content-page.dto.js';

@Injectable()
export class ContentPagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.contentPage.findMany({ orderBy: { slug: 'asc' } });
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.contentPage.findUnique({ where: { slug } });
    if (!page) throw new NotFoundException(`Página "${slug}" não encontrada`);
    return page;
  }

  async update(slug: string, dto: UpdateContentPageDto, actorEmail?: string) {
    const existing = await this.findBySlug(slug);
    const page = await this.prisma.contentPage.update({
      where: { slug },
      data: { title: dto.title, body: dto.body !== undefined ? sanitizeRichText(dto.body) : undefined },
    });
    await this.audit.log('CONTENT_PAGE_UPDATE', { entity: 'ContentPage', entityId: existing.id, actor: actorEmail });
    return page;
  }
}
