import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CacheService } from '../services/cache.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit() {
    // Create 100 hardcoded users if they don't exist
    const userCount = await this.usersRepository.count();
    if (userCount === 0) {
      const users: User[] = [];
      for (let i = 1; i <= 100; i++) {
        users.push(
          this.usersRepository.create({
            name: `User ${i}`,
            email: `user${i}@example.com`,
          }),
        );
      }
      await this.usersRepository.save(users);
    }
  }

  async findAll(): Promise<User[]> {
    const cacheKey = CacheService.generateListKey('users');

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log('Fetching users from database...');
        return this.usersRepository.find();
      },
      { ttl: 86400000, prefix: 'users' }, // Cache for 24 hours
    );
  }

  async findOne(id: number): Promise<User | null> {
    const cacheKey = CacheService.generateKey('user', id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log(`Fetching user ${id} from database...`);
        return this.usersRepository.findOne({ where: { id } });
      },
      { ttl: 86400000, prefix: 'users' }, // Cache for 24 hours
    );
  }

  async findByIds(ids: number[]): Promise<User[]> {
    const cacheKey = CacheService.generateListKey('users', {
      ids: ids.sort().join(','),
    });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log(
          `Fetching users by IDs [${ids.join(',')}] from database...`,
        );
        return this.usersRepository.findByIds(ids);
      },
      { ttl: 86400000, prefix: 'users' }, // Cache for 24 hours
    );
  }
}
