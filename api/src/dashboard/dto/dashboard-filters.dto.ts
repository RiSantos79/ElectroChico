import { IsEnum, IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/client.js';

export class DashboardFiltersDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsIn(['online', 'pickup'])
  channel?: 'online' | 'pickup';
}
