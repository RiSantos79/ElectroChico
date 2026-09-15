import { IsString, MinLength } from 'class-validator';

export class MfaEnableRequiredDto {
  @IsString()
  mfaSetupToken!: string;

  @IsString()
  @MinLength(6)
  code!: string;
}
