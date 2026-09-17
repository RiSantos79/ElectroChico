import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { AI_FEATURES, type AiFeature } from '../ai-features.js';

export class GenerateDto {
  @IsIn(AI_FEATURES as unknown as string[])
  feature!: AiFeature;

  // Contexto estruturado (nome do produto, texto atual, pergunta...) — o
  // prompt em si é sempre montado no servidor.
  @IsOptional()
  @IsObject()
  context?: Record<string, string>;
}

export class AssistantDto {
  @IsString()
  question!: string;
}
