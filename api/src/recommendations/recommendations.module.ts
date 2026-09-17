import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RecommendationsController } from './recommendations.controller.js';
import { RecommendationsService } from './recommendations.service.js';
import { RulesRecommendationStrategy } from './strategies/rules.strategy.js';

@Module({
  imports: [AuthModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, RulesRecommendationStrategy],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
