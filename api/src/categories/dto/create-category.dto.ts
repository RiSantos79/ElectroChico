import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  slug!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsArray()
  @IsString({ each: true })
  subcategories!: string[];
}
