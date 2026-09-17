import { ArrayMinSize, IsArray, IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';

export enum BulkPriceChangeMode {
  AMOUNT = 'amount',
  PERCENT = 'percent',
}

export class BulkPriceChangeDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];

  @IsEnum(BulkPriceChangeMode)
  mode!: BulkPriceChangeMode;

  // Em modo "amount": valor fixo em euros a somar (5 = +5€, -5 = -5€).
  // Em modo "percent": percentagem a aplicar (10 = +10%, -5 = -5%).
  @IsNumber()
  @Min(-100000)
  @Max(100000)
  value!: number;
}
