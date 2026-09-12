import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  @MinLength(1)
  street!: string;

  @IsString()
  @MinLength(1)
  streetNumber!: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsString()
  @MinLength(1)
  postalCode!: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
