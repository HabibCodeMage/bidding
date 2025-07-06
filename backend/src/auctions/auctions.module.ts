import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import { Auction } from '../entities/auction.entity';
import { Item } from '../entities/item.entity';
import { ItemsModule } from '../items/items.module';
import { BidsModule } from '../bids/bids.module';

@Module({
  imports: [TypeOrmModule.forFeature([Auction, Item]), ItemsModule, BidsModule],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {} 