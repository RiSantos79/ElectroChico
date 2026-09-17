import { ArrayMinSize, IsArray, IsNumber, IsString, Max, Min } from 'class-validator';

export class BulkPriceChangeDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];

  // Valor fixo (em euros) a somar ao preço atual — positivo para aumentar,
  // negativo para reduzir (ex.: 5 = +5€, -5 = -5€). Evita os cêntimos
  // estranhos que um aumento em percentagem produzia.
  @IsNumber()
  @Min(-100000)
  @Max(100000)
  amount!: number;
}
