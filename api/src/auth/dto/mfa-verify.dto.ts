import { IsString, MinLength } from 'class-validator';

export class MfaVerifyDto {
  @IsString()
  mfaToken!: string;

  @IsString()
  @MinLength(6)
  code!: string;
}
