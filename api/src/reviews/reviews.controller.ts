import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { RateLimit } from '../common/rate-limit.guard.js';

@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findAll(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Post()
  @UseGuards(RateLimit({ windowMs: 60 * 60_000, max: 10 }))
  create(@Param('productId') productId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(productId, dto);
  }
}
