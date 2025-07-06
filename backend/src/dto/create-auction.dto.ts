import { IsNumber, IsPositive, IsDateString } from 'class-validator';

export class CreateAuctionDto {
  @IsNumber()
  @IsPositive()
  itemId: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
} 