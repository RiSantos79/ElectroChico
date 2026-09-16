import { IsString, MinLength } from 'class-validator';

export class ChangePasswordRequiredDto {
  @IsString()
  passwordChangeToken!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
