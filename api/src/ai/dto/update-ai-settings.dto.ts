import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AiProvider } from '../../generated/prisma/client.js';

export class UpdateAiSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(AiProvider)
  provider?: AiProvider;

  // Vazio = manter a chave já guardada (o backoffice nunca recebe a atual).
  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;
}
