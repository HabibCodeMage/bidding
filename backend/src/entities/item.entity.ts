import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { Auction } from './auction.entity';

@Entity()
@Index(['name']) // Index for item name searches
@Index(['startingPrice']) // Index for price-based queries
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  startingPrice: number;

  @OneToMany(() => Auction, (auction) => auction.item)
  auctions: Auction[];
}
