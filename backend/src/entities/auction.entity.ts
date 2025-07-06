import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from './item.entity';
import { Bid } from './bid.entity';

@Entity()
@Index(['isActive', 'endTime']) // Index for finding active auctions
@Index(['itemId']) // Index for item lookups
@Index(['startTime']) // Index for auction start time queries
@Index(['currentHighestBid']) // Index for bid amount queries
export class Auction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, (item) => item.auctions)
  @JoinColumn()
  item: Item;

  @Column()
  itemId: number;

  @Column('timestamp')
  startTime: Date;

  @Column('timestamp')
  endTime: Date;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentHighestBid: number;

  @Column({ default: false })
  isActive: boolean;

  @OneToMany(() => Bid, (bid) => bid.auction)
  bids: Bid[];
}
