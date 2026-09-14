import { IsString, MinLength } from 'class-validator';

export class MfaEnableDto {
  @IsString()
  @MinLength(6)
  code!: string;
}
