import { BadRequestException, Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service.js';
import { UpdateRecommendationSettingsDto } from './dto/update-recommendation-settings.dto.js';
import { RECOMMENDATION_KINDS, type RecommendationKind } from './strategies/types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SuperAdminGuard } from '../auth/super-admin.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  // Público: é o que alimenta a ficha de produto na loja.
  @Get('product/:productId')
  forProduct(
    @Param('productId') productId: string,
    @Query('kind') kind?: string,
    @Query('limit') limit?: string,
  ) {
    const resolved = (kind ?? 'RELATED').toUpperCase() as RecommendationKind;
    if (!RECOMMENDATION_KINDS.includes(resolved)) {
      throw new BadRequestException(`Tipo inválido. Use um de: ${RECOMMENDATION_KINDS.join(', ')}`);
    }
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.recommendationsService.recommend(
      productId,
      resolved,
      Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get('settings')
  getSettings() {
    return this.recommendationsService.getSettings();
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Patch('settings')
  updateSettings(@Body() dto: UpdateRecommendationSettingsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.recommendationsService.updateSettings(dto, user.email);
  }
}
