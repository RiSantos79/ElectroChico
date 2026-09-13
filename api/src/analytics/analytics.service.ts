import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  recordPageView(path: string) {
    return this.prisma.pageView.create({ data: { path } });
  }
}
