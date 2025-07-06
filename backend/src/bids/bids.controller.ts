import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { BidsService } from './bids.service';
import { PlaceBidDto } from '../dto/place-bid.dto';
import { Bid } from '../entities/bid.entity';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  async placeBid(@Body() placeBidDto: PlaceBidDto): Promise<Bid> {
    return this.bidsService.placeBid(placeBidDto);
  }

  @Get('auction/:auctionId')
  async getAuctionBids(@Param('auctionId', ParseIntPipe) auctionId: number): Promise<Bid[]> {
    return this.bidsService.getAuctionBids(auctionId);
  }

  @Get('auction/:auctionId/history')
  async getBidHistory(@Param('auctionId', ParseIntPipe) auctionId: number): Promise<Bid[]> {
    return this.bidsService.getBidHistory(auctionId);
  }

  @Get('auction/:auctionId/winning')
  async getWinningBid(@Param('auctionId', ParseIntPipe) auctionId: number): Promise<Bid | null> {
    return this.bidsService.getWinningBid(auctionId);
  }

  @Get('user/:userId')
  async getUserBids(@Param('userId', ParseIntPipe) userId: number): Promise<Bid[]> {
    return this.bidsService.getUserBids(userId);
  }
} 