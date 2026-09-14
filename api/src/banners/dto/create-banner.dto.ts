import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { BannerSize } from '../../generated/prisma/client.js';

export class CreateBannerDto {
  @IsEnum(BannerSize)
  size!: BannerSize;

  @IsOptional()
  @IsString()
  eyebrow?: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(1)
  linkUrl!: string;

  @IsOptional()
  @IsString()
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
