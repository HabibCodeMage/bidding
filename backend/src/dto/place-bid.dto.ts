import { IsNumber, IsPositive } from 'class-validator';

export class PlaceBidDto {
  @IsNumber()
  @IsPositive()
  userId: number;

  @IsNumber()
  @IsPositive()
  auctionId: number;

  @IsNumber()
  @IsPositive()
  amount: number;
} 