import { IsString, MinLength } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @MinLength(1)
  subject!: string;

  @IsString()
  @MinLength(1)
  body!: string;
}
