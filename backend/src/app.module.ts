import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { AuctionsModule } from './auctions/auctions.module';
import { BidsModule } from './bids/bids.module';
import { AuctionGateway } from './gateways/auction.gateway';
import { RedisService } from './services/redis.service';
import { CacheService } from './services/cache.service';
import { CacheController } from './controllers/cache.controller';
import { User } from './entities/user.entity';
import { Item } from './entities/item.entity';
import { Auction } from './entities/auction.entity';
import { Bid } from './entities/bid.entity';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
        password: configService.get<string>('REDIS_PASSWORD'),
        ttl: configService.get<number>('CACHE_TTL') || 30000,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, Item, Auction, Bid],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: false,
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        // Connection pooling configuration
        extra: {
          connectionLimit: 20,
          acquireTimeout: 60000,
          timeout: 60000,
          reconnect: true,
        },
        // Performance optimizations
        maxQueryExecutionTime: 1000,
        cache: {
          duration: 30000, // 30 seconds
        },
        // Connection pool settings
        poolSize: 20,
        keepConnectionAlive: true,
        // Query optimization
        queryCache: true,
        queryCacheDuration: 30000,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ItemsModule,
    AuctionsModule,
    BidsModule,
  ],
  controllers: [AppController, CacheController],
  providers: [AppService, AuctionGateway, RedisService, CacheService],
  exports: [AuctionGateway, RedisService, CacheService],
})
export class AppModule {}
