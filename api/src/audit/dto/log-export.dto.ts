import { IsInt, IsString, Min } from 'class-validator';

export class LogExportDto {
  @IsString()
  entity!: string;

  @IsInt()
  @Min(0)
  count!: number;
}
