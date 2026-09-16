import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BulkDeleteStaffDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];
}
