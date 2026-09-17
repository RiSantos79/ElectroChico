import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto.js';
import { AssistantDto, GenerateDto } from './dto/generate.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { StaffGuard } from '../auth/staff.guard.js';
import { SuperAdminGuard } from '../auth/super-admin.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Qualquer conta de staff pode saber se a IA está ligada — é o que faz os
  // botões de IA aparecerem ou não. Nunca devolve configuração.
  @UseGuards(StaffGuard)
  @Get('status')
  status() {
    return this.aiService.status();
  }

  @UseGuards(SuperAdminGuard)
  @Get('settings')
  getSettings() {
    return this.aiService.getSettings();
  }

  @UseGuards(SuperAdminGuard)
  @Patch('settings')
  updateSettings(@Body() dto: UpdateAiSettingsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.aiService.updateSettings(dto, user.email);
  }

  @UseGuards(SuperAdminGuard)
  @Delete('settings/key')
  removeKey(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.removeApiKey(user.email);
  }

  @UseGuards(SuperAdminGuard)
  @Post('test')
  test(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.testConnection(user.email);
  }

  @UseGuards(SuperAdminGuard)
  @Get('usage')
  usage() {
    return this.aiService.usage();
  }

  @UseGuards(StaffGuard)
  @Post('generate')
  generate(@Body() dto: GenerateDto, @CurrentUser() user: AuthenticatedUser) {
    return this.aiService.generate(dto.feature, dto.context ?? {}, user.email);
  }

  @UseGuards(StaffGuard)
  @Post('assistant')
  assistant(@Body() dto: AssistantDto, @CurrentUser() user: AuthenticatedUser) {
    return this.aiService.assistant(dto.question, user.email);
  }
}
