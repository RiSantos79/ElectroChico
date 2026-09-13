import { EnergyClass, ProductBadge } from '../../generated/prisma/client.js';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { slugify } from '../../common/slugify.js';

export class CreateProductDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? slugify(value) : value))
  slug!: string;

  @IsString()
  name!: string;

  @IsString()
  brand!: string;

  @IsString()
  categoryId!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  oldPrice?: number;

  @IsEnum(EnergyClass)
  energyClass!: EnergyClass;

  @IsInt()
  @Min(0)
  stockQuantity!: number;

  @IsOptional()
  @IsEnum(ProductBadge)
  badge?: ProductBadge;

  @IsString()
  color!: string;

  @IsString()
  description!: string;

  @IsString()
  specs!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
