import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Auction } from './auction.entity';

@Entity()
@Index(['auctionId', 'createdAt']) // Index for auction bid history
@Index(['userId', 'createdAt']) // Index for user bid history
@Index(['auctionId', 'isWinningBid']) // Index for winning bid lookups
@Index(['amount']) // Index for bid amount queries
@Index(['createdAt']) // Index for time-based queries
export class Bid {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.bids)
  @JoinColumn()
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Auction, (auction) => auction.bids)
  @JoinColumn()
  auction: Auction;

  @Column()
  auctionId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ default: false })
  isWinningBid: boolean;
}
