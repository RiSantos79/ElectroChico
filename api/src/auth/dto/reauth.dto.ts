import { IsOptional, IsString } from 'class-validator';

export class ReauthDto {
  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  code?: string;
}
