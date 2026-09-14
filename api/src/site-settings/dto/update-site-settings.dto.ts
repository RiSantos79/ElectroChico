import { IsOptional, IsString } from 'class-validator';

export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  copyrightText?: string;

  @IsOptional()
  @IsString()
  trustBadge1Title?: string;

  @IsOptional()
  @IsString()
  trustBadge1Desc?: string;

  @IsOptional()
  @IsString()
  trustBadge2Title?: string;

  @IsOptional()
  @IsString()
  trustBadge2Desc?: string;

  @IsOptional()
  @IsString()
  trustBadge3Title?: string;

  @IsOptional()
  @IsString()
  trustBadge3Desc?: string;

  @IsOptional()
  @IsString()
  trustBadge4Title?: string;

  @IsOptional()
  @IsString()
  trustBadge4Desc?: string;
}
