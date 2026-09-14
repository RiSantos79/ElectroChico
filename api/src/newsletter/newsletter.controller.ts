import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NewsletterService } from './newsletter.service.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';
import { UpdateCampaignDto } from './dto/update-campaign.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';

@Controller('newsletter')
@UseGuards(JwtAuthGuard, AdminGuard)
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Get('subscribers')
  findSubscribers(@Query('includeUnsubscribed') includeUnsubscribed?: string) {
    return this.newsletterService.findSubscribers(includeUnsubscribed === 'true');
  }

  @Post('subscribers/:id/unsubscribe')
  unsubscribe(@Param('id') id: string) {
    return this.newsletterService.unsubscribe(id);
  }

  @Get('campaigns')
  findCampaigns() {
    return this.newsletterService.findCampaigns();
  }

  @Post('campaigns')
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.newsletterService.createCampaign(dto);
  }

  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.newsletterService.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  removeCampaign(@Param('id') id: string) {
    return this.newsletterService.removeCampaign(id);
  }

  @Post('campaigns/:id/send')
  sendCampaign(@Param('id') id: string) {
    return this.newsletterService.sendCampaign(id);
  }
}
