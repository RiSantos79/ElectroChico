import { EnergyClass, ProductBadge, StockStatus } from '../../generated/prisma/client.js';
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
import { Type } from 'class-transformer';

class SpecDto {
  @IsString()
  label!: string;

  @IsString()
  value!: string;
}

export class CreateProductDto {
  @IsString()
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reviews?: number;

  @IsOptional()
  @IsEnum(StockStatus)
  stock?: StockStatus;

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
}
