import { IsString, MinLength } from 'class-validator';

export class ReplyContactMessageDto {
  @IsString()
  @MinLength(1)
  reply!: string;
}
