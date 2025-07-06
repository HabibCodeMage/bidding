import { Controller, Get, Post, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from '../dto/create-auction.dto';
import { Auction } from '../entities/auction.entity';
import { AuctionGateway } from '../gateways/auction.gateway';
import { PaginationDto, PaginatedResponse } from '../dto/pagination.dto';

@Controller('auctions')
export class AuctionsController {
  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly auctionGateway: AuctionGateway,
  ) {}

  @Post()
  async create(@Body() createAuctionDto: CreateAuctionDto): Promise<Auction> {
    const auction = await this.auctionsService.create(createAuctionDto);
    
    // Emit WebSocket event directly to current instance clients
    this.auctionGateway.server.to('dashboard').emit('auctionCreated', auction);
    
    // Also publish to Redis for other instances
    await this.auctionGateway.emitAuctionCreated(auction);
    
    return auction;
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<Auction>> {
    return this.auctionsService.findAll(paginationDto);
  }

  @Get('active')
  async findActive(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<Auction>> {
    return this.auctionsService.findActiveAuctions(paginationDto);
  }

  @Get('ended')
  async findEnded(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<Auction>> {
    return this.auctionsService.findEndedAuctions(paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Auction> {
    return this.auctionsService.findOne(id);
  }

  @Get(':id/highest-bid')
  async getCurrentHighestBid(@Param('id', ParseIntPipe) id: number): Promise<{ currentHighestBid: number }> {
    const currentHighestBid = await this.auctionsService.getCurrentHighestBid(id);
    return { currentHighestBid };
  }
} 