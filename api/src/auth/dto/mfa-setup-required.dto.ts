import { IsString } from 'class-validator';

export class MfaSetupRequiredDto {
  @IsString()
  mfaSetupToken!: string;
}
