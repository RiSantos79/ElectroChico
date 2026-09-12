import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ContactType } from '../../generated/prisma/client.js';

export class CreateContactMessageDto {
  @IsEnum(ContactType)
  type!: ContactType;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  productName?: string;
}
