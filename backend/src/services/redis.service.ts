import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private messageHandlers: Map<string, (message: any) => void> = new Map();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisConfig = {
        host: this.configService.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(
          this.configService.get<string>('REDIS_PORT') || '6379',
          10,
        ),
        password: this.configService.get<string>('REDIS_PASSWORD'),
      };

      // Create publisher client
      this.publisher = new Redis(redisConfig);

      // Create subscriber client
      this.subscriber = new Redis(redisConfig);

      // Handle incoming messages
      this.subscriber.on('message', (channel, message) => {
        const handler = this.messageHandlers.get(channel);
        if (handler) {
          try {
            const parsedMessage = JSON.parse(message);
            handler(parsedMessage);
          } catch (error) {
            console.error(
              `Error parsing Redis message from channel ${channel}:`,
              error,
            );
          }
        }
      });

      console.log('Redis pub/sub service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis service:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.publisher) {
      await this.publisher.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
  }

  // Subscribe to a channel
  async subscribe(channel: string, handler: (message: any) => void) {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not initialized');
    }
    await this.subscriber.subscribe(channel);
    this.messageHandlers.set(channel, handler);
    console.log(`Subscribed to Redis channel: ${channel}`);
  }

  // Unsubscribe from a channel
  async unsubscribe(channel: string) {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not initialized');
    }
    await this.subscriber.unsubscribe(channel);
    this.messageHandlers.delete(channel);
    console.log(`Unsubscribed from Redis channel: ${channel}`);
  }

  // Publish a message to a channel
  async publish(channel: string, message: any) {
    if (!this.publisher) {
      throw new Error('Redis publisher not initialized');
    }
    const messageString = JSON.stringify(message);
    await this.publisher.publish(channel, messageString);
    console.log(`Published message to Redis channel: ${channel}`);
  }

  // Get Redis client for other operations
  getClient(): Redis | null {
    return this.publisher;
  }
} 