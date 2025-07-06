import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BidsService } from '../bids/bids.service';
import { AuctionsService } from '../auctions/auctions.service';
import { PlaceBidDto } from '../dto/place-bid.dto';
import { RedisService } from '../services/redis.service';

interface RedisBidMessage {
  bid: any;
  auctionId: number;
  newHighestBid: number;
  instanceId: string;
}

interface RedisAuctionMessage {
  auction: any;
  auctionId: number;
  instanceId: string;
}

interface RedisAuctionEndMessage {
  auctionId: number;
  winningBid: any;
  instanceId: string;
}

interface RedisAuctionCreatedMessage {
  auction: any;
  instanceId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AuctionGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly bidsService: BidsService,
    private readonly auctionsService: AuctionsService,
    private readonly redisService: RedisService,
  ) {}

  async afterInit() {
    // Wait for Redis service to be initialized
    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
      try {
        // Subscribe to Redis channels for cross-instance communication
        await this.redisService.subscribe(
          'auction:bid:placed',
          (message: RedisBidMessage) => {
            this.handleRedisBidPlaced(message);
          },
        );

        await this.redisService.subscribe(
          'auction:updated',
          (message: RedisAuctionMessage) => {
            this.handleRedisAuctionUpdated(message);
          },
        );

        await this.redisService.subscribe(
          'auction:ended',
          (message: RedisAuctionEndMessage) => {
            this.handleRedisAuctionEnded(message);
          },
        );

        await this.redisService.subscribe(
          'auction:created',
          (message: RedisAuctionCreatedMessage) => {
            this.handleRedisAuctionCreated(message);
          },
        );

        console.log('AuctionGateway initialized with Redis pub/sub');
        break;
      } catch (error) {
        retries++;
        console.log(`Redis not ready, retrying... (${retries}/${maxRetries})`);
        if (retries >= maxRetries) {
          console.error('Failed to initialize Redis pub/sub after maximum retries');
          throw error;
        }
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinAuction')
  handleJoinAuction(client: Socket, auctionId: number) {
    client.join(`auction-${auctionId}`);
    console.log(`Client ${client.id} joined auction ${auctionId}`);
  }

  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(client: Socket, auctionId: number) {
    client.leave(`auction-${auctionId}`);
    console.log(`Client ${client.id} left auction ${auctionId}`);
  }

  @SubscribeMessage('joinDashboard')
  handleJoinDashboard(client: Socket) {
    client.join('dashboard');
    console.log(`Client ${client.id} joined dashboard`);
  }

  @SubscribeMessage('leaveDashboard')
  handleLeaveDashboard(client: Socket) {
    client.leave('dashboard');
    console.log(`Client ${client.id} left dashboard`);
  }

  @SubscribeMessage('placeBid')
  async handlePlaceBid(client: Socket, placeBidDto: PlaceBidDto) {
    try {
      const bid = await this.bidsService.placeBid(placeBidDto);

      // Emit directly to all clients in the current instance
      this.server.to(`auction-${placeBidDto.auctionId}`).emit('bidPlaced', {
        bid,
        auctionId: placeBidDto.auctionId,
        newHighestBid: bid.amount,
      });

      // Emit success to the client who placed the bid
      client.emit('bidSuccess', {
        message: 'Bid placed successfully',
        bid,
      });

      // Get updated auction data and emit directly to current instance
      const auction = await this.auctionsService.findOne(placeBidDto.auctionId);
      this.server
        .to(`auction-${placeBidDto.auctionId}`)
        .emit('auctionUpdated', auction);

      // Also emit to dashboard for real-time updates
      this.server.to('dashboard').emit('auctionUpdated', auction);

      // Publish to Redis for other instances (but not for current instance)
      await this.redisService.publish('auction:bid:placed', {
        bid,
        auctionId: placeBidDto.auctionId,
        newHighestBid: bid.amount,
        instanceId: process.env.INSTANCE_ID || 'unknown',
      });

      await this.redisService.publish('auction:updated', {
        auction,
        auctionId: placeBidDto.auctionId,
        instanceId: process.env.INSTANCE_ID || 'unknown',
      });
    } catch (error: any) {
      client.emit('bidError', {
        message: error.message,
        auctionId: placeBidDto.auctionId,
      });
    }
  }

  // Handle Redis messages from other instances
  private handleRedisBidPlaced(message: RedisBidMessage) {
    // Only emit if the message is from a different instance
    if (message.instanceId !== (process.env.INSTANCE_ID || 'unknown')) {
      this.server.to(`auction-${message.auctionId}`).emit('bidPlaced', {
        bid: message.bid,
        auctionId: message.auctionId,
        newHighestBid: message.newHighestBid,
      });
    }
  }

  private handleRedisAuctionUpdated(message: RedisAuctionMessage) {
    // Only emit if the message is from a different instance
    if (message.instanceId !== (process.env.INSTANCE_ID || 'unknown')) {
      this.server
        .to(`auction-${message.auctionId}`)
        .emit('auctionUpdated', message.auction);
      this.server.to('dashboard').emit('auctionUpdated', message.auction);
    }
  }

  private handleRedisAuctionEnded(message: RedisAuctionEndMessage) {
    // Only emit if the message is from a different instance
    if (message.instanceId !== (process.env.INSTANCE_ID || 'unknown')) {
      this.server.to(`auction-${message.auctionId}`).emit('auctionEnded', {
        auctionId: message.auctionId,
        winningBid: message.winningBid,
      });
    }
  }

  private handleRedisAuctionCreated(message: RedisAuctionCreatedMessage) {
    // Only emit if the message is from a different instance
    if (message.instanceId !== (process.env.INSTANCE_ID || 'unknown')) {
      this.server.to('dashboard').emit('auctionCreated', message.auction);
    }
  }

  // Method to emit auction updates to all connected clients (now publishes to Redis)
  async emitAuctionUpdate(auctionId: number, data: any) {
    await this.redisService.publish('auction:updated', {
      auction: data,
      auctionId,
      instanceId: process.env.INSTANCE_ID || 'unknown',
    });
  }

  // Method to emit bid updates to all connected clients (now publishes to Redis)
  async emitBidUpdate(auctionId: number, bid: any) {
    await this.redisService.publish('auction:bid:placed', {
      bid,
      auctionId,
      newHighestBid: bid.amount,
      instanceId: process.env.INSTANCE_ID || 'unknown',
    });
  }

  // Method to emit auction end to all connected clients (now publishes to Redis)
  async emitAuctionEnd(auctionId: number, winningBid: any) {
    await this.redisService.publish('auction:ended', {
      auctionId,
      winningBid,
      instanceId: process.env.INSTANCE_ID || 'unknown',
    });
  }

  // Method to emit auction creation to all connected clients (now publishes to Redis)
  async emitAuctionCreated(auction: any) {
    await this.redisService.publish('auction:created', {
      auction,
      instanceId: process.env.INSTANCE_ID || 'unknown',
    });
  }
}
