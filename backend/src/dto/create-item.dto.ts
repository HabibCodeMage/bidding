import { IsString, IsNumber, IsPositive, MinLength } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsNumber()
  @IsPositive()
  startingPrice: number;
} 