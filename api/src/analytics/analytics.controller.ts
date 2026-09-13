import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { TrackPageViewDto } from './dto/track-pageview.dto.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Público e sem autenticação de propósito — é chamado no browser em cada
  // navegação, antes de sabermos se há sessão. Não grava IP nem user agent.
  @Post('pageview')
  @HttpCode(204)
  async trackPageView(@Body() dto: TrackPageViewDto) {
    await this.analyticsService.recordPageView(dto.path);
  }
}
