import { EnergyClass } from '../../generated/prisma/client.js';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ImportProductRowDto {
  // Presente = atualiza o produto existente; ausente = cria um produto novo.
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name!: string;

  // Slug da marca/categoria, tal como aparece na exportação (ex.: "electrolux",
  // "frigorificos") — nunca cria marcas/categorias novas por um valor mal
  // escrito, essa linha fica reportada como erro.
  @IsString()
  brand!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  ean?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  oldPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsEnum(EnergyClass)
  energyClass?: EnergyClass;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class BulkImportProductsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportProductRowDto)
  rows!: ImportProductRowDto[];
}
