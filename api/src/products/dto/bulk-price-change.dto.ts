import { ArrayMinSize, IsArray, IsNumber, IsString, Max, Min } from 'class-validator';

export class BulkPriceChangeDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];

  // Percentagem a aplicar ao preço atual — positiva para aumentar, negativa
  // para reduzir (ex.: 10 = +10%, -5 = -5%).
  @IsNumber()
  @Min(-90)
  @Max(1000)
  percent!: number;
}
