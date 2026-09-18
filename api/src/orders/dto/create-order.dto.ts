import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';

class OrderItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  giftMessage?: string;
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

  // Escolhido de uma lista fechada no checkout, por isso texto livre chega —
  // opcional para não invalidar integrações antigas.
  @IsOptional()
  @IsString()
  concelho?: string;

  @IsOptional()
  @IsBoolean()
  newsletterOptIn?: boolean;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
