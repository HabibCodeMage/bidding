import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bid } from '../entities/bid.entity';
import { Auction } from '../entities/auction.entity';
import { User } from '../entities/user.entity';
import { PlaceBidDto } from '../dto/place-bid.dto';

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(Bid)
    private bidsRepository: Repository<Bid>,
    @InjectRepository(Auction)
    private auctionsRepository: Repository<Auction>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async placeBid(placeBidDto: PlaceBidDto): Promise<Bid> {
    // Use database transaction to handle race conditions
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user exists
      const user = await queryRunner.manager.findOne(User, {
        where: { id: placeBidDto.userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if auction exists and is active
      const auction = await queryRunner.manager.findOne(Auction, {
        where: { id: placeBidDto.auctionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      if (!auction.isActive) {
        throw new BadRequestException('Auction has ended');
      }

      if (new Date() > auction.endTime) {
        throw new BadRequestException('Auction has expired');
      }

      // Check if bid is higher than current highest bid
      if (placeBidDto.amount <= auction.currentHighestBid) {
        throw new BadRequestException('Bid must be higher than current highest bid');
      }

      // Create the bid
      const bid = queryRunner.manager.create(Bid, {
        userId: placeBidDto.userId,
        auctionId: placeBidDto.auctionId,
        amount: placeBidDto.amount,
        isWinningBid: true,
      });

      // Update previous winning bid to false
      await queryRunner.manager.update(Bid, 
        { auctionId: placeBidDto.auctionId, isWinningBid: true },
        { isWinningBid: false }
      );

      // Save the new bid
      const savedBid = await queryRunner.manager.save(Bid, bid);

      // Update auction's current highest bid
      auction.currentHighestBid = placeBidDto.amount;
      await queryRunner.manager.save(Auction, auction);

      await queryRunner.commitTransaction();
      return savedBid;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getBidHistory(auctionId: number): Promise<Bid[]> {
    return this.bidsRepository.find({
      where: { auctionId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getWinningBid(auctionId: number): Promise<Bid | null> {
    return this.bidsRepository.findOne({
      where: { auctionId, isWinningBid: true },
      relations: ['user'],
    });
  }

  async getUserBids(userId: number): Promise<Bid[]> {
    return this.bidsRepository.find({
      where: { userId },
      relations: ['auction', 'auction.item'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAuctionBids(auctionId: number): Promise<Bid[]> {
    return this.bidsRepository.find({
      where: { auctionId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
} 