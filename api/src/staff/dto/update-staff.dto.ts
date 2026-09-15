import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../generated/prisma/client.js';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
