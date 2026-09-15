import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NewsletterService } from './newsletter.service.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';
import { UpdateCampaignDto } from './dto/update-campaign.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';

@Controller('newsletter')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @RequirePermission('configuracoes', 'view')
  @Get('subscribers')
  findSubscribers(@Query('includeUnsubscribed') includeUnsubscribed?: string) {
    return this.newsletterService.findSubscribers(includeUnsubscribed === 'true');
  }

  @RequirePermission('configuracoes', 'edit')
  @Post('subscribers/:id/unsubscribe')
  unsubscribe(@Param('id') id: string) {
    return this.newsletterService.unsubscribe(id);
  }

  @RequirePermission('configuracoes', 'view')
  @Get('campaigns')
  findCampaigns() {
    return this.newsletterService.findCampaigns();
  }

  @RequirePermission('configuracoes', 'create')
  @Post('campaigns')
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.newsletterService.createCampaign(dto);
  }

  @RequirePermission('configuracoes', 'edit')
  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.newsletterService.updateCampaign(id, dto);
  }

  @RequirePermission('configuracoes', 'delete')
  @Delete('campaigns/:id')
  removeCampaign(@Param('id') id: string) {
    return this.newsletterService.removeCampaign(id);
  }

  @RequirePermission('configuracoes', 'edit')
  @Post('campaigns/:id/send')
  sendCampaign(@Param('id') id: string) {
    return this.newsletterService.sendCampaign(id);
  }
}
