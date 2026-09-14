import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateContentPageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;
}
