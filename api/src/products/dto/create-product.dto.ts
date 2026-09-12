import { EnergyClass, ProductBadge } from '../../generated/prisma/client.js';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { slugify } from '../../common/slugify.js';

class SpecDto {
  @IsString()
  label!: string;

  @IsString()
  value!: string;
}

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecDto)
  specs!: SpecDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
