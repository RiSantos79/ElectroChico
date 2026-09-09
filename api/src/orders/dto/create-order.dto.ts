import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';

class OrderItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsString()
  @MinLength(6)
  customerPhone!: string;

  @IsString()
  street!: string;

  @IsString()
  streetNumber!: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsString()
  postalCode!: string;

  @IsString()
  city!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
