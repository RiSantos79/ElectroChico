import { IsString, MaxLength, MinLength } from 'class-validator';

export class TrackPageViewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  path!: string;
}
