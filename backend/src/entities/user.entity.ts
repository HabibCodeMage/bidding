import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { Bid } from './bid.entity';

@Entity()
@Index(['email']) // Index for email lookups
@Index(['name']) // Index for name searches
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @OneToMany(() => Bid, (bid) => bid.user)
  bids: Bid[];
}
