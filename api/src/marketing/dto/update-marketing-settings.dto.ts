import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateMarketingSettingsDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  groupId?: string;

  // Campo vazio mantém a chave já guardada — nunca é devolvida ao frontend,
  // por isso o formulário não a consegue reenviar.
  @IsOptional()
  @IsString()
  apiKey?: string;
}
