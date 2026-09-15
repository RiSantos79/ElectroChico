import { IsEnum } from 'class-validator';
import { UserStatus } from '../../generated/prisma/client.js';

export class UpdateStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
