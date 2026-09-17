import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateRecommendationSettingsDto {
  @IsOptional()
  @IsIn(['RULES', 'ML'])
  strategy?: 'RULES' | 'ML';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;

  @IsOptional()
  @IsBoolean()
  preferSameBrand?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  priceTolerancePct?: number;

  @IsOptional()
  @IsBoolean()
  useCoPurchase?: boolean;

  @IsOptional()
  @IsString()
  mlEndpoint?: string;

  // Vazio = manter a chave já guardada.
  @IsOptional()
  @IsString()
  mlApiKey?: string;
}
