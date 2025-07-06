import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, LessThanOrEqual } from 'typeorm';
import { Auction } from '../entities/auction.entity';
import { Item } from '../entities/item.entity';
import { CreateAuctionDto } from '../dto/create-auction.dto';
import { PaginationDto, PaginatedResponse } from '../dto/pagination.dto';

@Injectable()
export class AuctionsService {
  constructor(
    @InjectRepository(Auction)
    private auctionsRepository: Repository<Auction>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private dataSource: DataSource,
  ) {}

  async create(createAuctionDto: CreateAuctionDto): Promise<Auction> {
    const item = await this.itemsRepository.findOne({
      where: { id: createAuctionDto.itemId },
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const auction = this.auctionsRepository.create({
      ...createAuctionDto,
      startTime: new Date(createAuctionDto.startTime),
      endTime: new Date(createAuctionDto.endTime),
      currentHighestBid: item.startingPrice,
      isActive: true,
    });

    return this.auctionsRepository.save(auction);
  }

  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<Auction>> {
    const { page = 1, pageSize = 10 } = paginationDto || {};
    const skip = (page - 1) * pageSize;

    const [data] = await this.auctionsRepository.findAndCount({
      relations: ['item', 'bids'],
      order: { endTime: 'ASC' },
      skip,
      take: pageSize + 1, // Get one extra to check if there are more
    });

    const hasMore = data.length > pageSize;
    const result = hasMore ? data.slice(0, pageSize) : data;

    return {
      data: result,
      page,
      pageSize,
      hasMore,
    };
  }

  async findOne(id: number): Promise<Auction> {
    const auction = await this.auctionsRepository.findOne({
      where: { id },
      relations: ['item', 'bids', 'bids.user'],
      order: { bids: { createdAt: 'DESC' } },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  async findActiveAuctions(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<Auction>> {
    const { page = 1, pageSize = 10 } = paginationDto || {};
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const [data] = await this.auctionsRepository.findAndCount({
      where: {
        isActive: true,
        endTime: MoreThan(now),
      },
      relations: ['item'],
      order: { endTime: 'ASC' },
      skip,
      take: pageSize + 1, // Get one extra to check if there are more
    });

    const hasMore = data.length > pageSize;
    const result = hasMore ? data.slice(0, pageSize) : data;

    return {
      data: result,
      page,
      pageSize,
      hasMore,
    };
  }

  async findEndedAuctions(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<Auction>> {
    const { page = 1, pageSize = 10 } = paginationDto || {};
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const [data] = await this.auctionsRepository.findAndCount({
      where: [
        { isActive: false },
        { endTime: LessThanOrEqual(now) },
      ],
      relations: ['item', 'bids'],
      order: { endTime: 'DESC' },
      skip,
      take: pageSize + 1, // Get one extra to check if there are more
    });

    const hasMore = data.length > pageSize;
    const result = hasMore ? data.slice(0, pageSize) : data;

    return {
      data: result,
      page,
      pageSize,
      hasMore,
    };
  }

  async updateAuctionStatus(): Promise<void> {
    const now = new Date();
    await this.auctionsRepository.update(
      {
        isActive: true,
        endTime: LessThanOrEqual(now),
      },
      { isActive: false },
    );
  }

  async getCurrentHighestBid(auctionId: number): Promise<number> {
    const auction = await this.auctionsRepository.findOne({
      where: { id: auctionId },
      select: ['currentHighestBid'],
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction.currentHighestBid;
  }

  async updateHighestBid(
    auctionId: number,
    newBidAmount: number,
  ): Promise<boolean> {
    // Use database transaction to handle race conditions
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const auction = await queryRunner.manager.findOne(Auction, {
        where: { id: auctionId },
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

      if (newBidAmount <= auction.currentHighestBid) {
        throw new BadRequestException(
          'Bid must be higher than current highest bid',
        );
      }

      auction.currentHighestBid = newBidAmount;
      await queryRunner.manager.save(Auction, auction);

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
