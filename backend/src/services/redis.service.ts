import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private messageHandlers: Map<string, (message: any) => void> = new Map();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const isProduction =
        this.configService.get<string>('NODE_ENV') === 'production';
      const redisUrl =
        this.configService.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379';
      // Create publisher client
      this.publisher = new Redis(redisUrl, {
        tls: isProduction ? { rejectUnauthorized: false } : undefined,
      });

      // Create subscriber client
      this.subscriber = new Redis(redisUrl, {
        tls: isProduction ? { rejectUnauthorized: false } : undefined,
      });

      // Handle connection events
      this.publisher.on('error', (error) => {
        console.error('Redis publisher error:', error);
      });

      this.subscriber.on('error', (error) => {
        console.error('Redis subscriber error:', error);
      });

      this.publisher.on('connect', () => {
        console.log('Redis publisher connected');
      });

      this.subscriber.on('connect', () => {
        console.log('Redis subscriber connected');
      });

      this.publisher.on('ready', () => {
        console.log('Redis publisher ready');
      });

      this.subscriber.on('ready', () => {
        console.log('Redis subscriber ready');
      });

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
