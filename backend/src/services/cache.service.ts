import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisService } from './redis.service';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  prefix?: string; // Key prefix for namespacing
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly defaultTTL = 30000; // 30 seconds
  private readonly defaultPrefix = 'cache';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Set a value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const { ttl = this.defaultTTL, prefix = this.defaultPrefix } = options;
    const fullKey = this.buildKey(key, prefix);

    try {
      const redisClient = this.redisService.getClient();
      if (!redisClient) {
        throw new Error('Redis client not available');
      }

      const serializedValue = JSON.stringify(value);
      await redisClient.setex(fullKey, Math.floor(ttl / 1000), serializedValue);
      console.log(`Cache SET: ${fullKey} (TTL: ${ttl}ms)`);
    } catch (error) {
      console.error(`Cache SET error for key ${fullKey}:`, error);
      throw error;
    }
  }

    /**
   * Get a value from cache
   */
  async get<T>(key: string, prefix?: string): Promise<T | null> {
    const fullKey = this.buildKey(key, prefix || this.defaultPrefix);

    try {
      const redisClient = this.redisService.getClient();
      if (!redisClient) {
        throw new Error('Redis client not available');
      }

      const value = await redisClient.get(fullKey);
      if (value !== null && value !== undefined) {
        console.log(`Cache HIT: ${fullKey}`);
        return JSON.parse(value) as T;
      } else {
        console.log(`Cache MISS: ${fullKey}`);
        return null;
      }
    } catch (error) {
      console.error(`Cache GET error for key ${fullKey}:`, error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string, prefix?: string): Promise<boolean> {
    const fullKey = this.buildKey(key, prefix || this.defaultPrefix);

    try {
      const redisClient = this.redisService.getClient();
      if (!redisClient) {
        throw new Error('Redis client not available');
      }

      const result = await redisClient.del(fullKey);
      console.log(`Cache DELETE: ${fullKey}`);
      return result > 0;
    } catch (error) {
      console.error(`Cache DELETE error for key ${fullKey}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string, prefix?: string): Promise<boolean> {
    const fullKey = this.buildKey(key, prefix || this.defaultPrefix);

    try {
      const redisClient = this.redisService.getClient();
      if (!redisClient) {
        throw new Error('Redis client not available');
      }

      const exists = await redisClient.exists(fullKey);
      return exists > 0;
    } catch (error) {
      console.error(`Cache EXISTS error for key ${fullKey}:`, error);
      return false;
    }
  }

  /**
   * Get or set a value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key, options.prefix);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Set multiple values at once
   */
  async mset<T>(
    keyValuePairs: Array<{ key: string; value: T }>,
    options: CacheOptions = {},
  ): Promise<void> {
    const { ttl = this.defaultTTL, prefix = this.defaultPrefix } = options;

    try {
      const promises = keyValuePairs.map(({ key, value }) =>
        this.set(key, value, { ttl, prefix }),
      );
      await Promise.all(promises);
      console.log(`Cache MSET: ${keyValuePairs.length} keys`);
    } catch (error) {
      console.error('Cache MSET error:', error);
      throw error;
    }
  }

  /**
   * Get multiple values at once
   */
  async mget<T>(keys: string[], prefix?: string): Promise<Array<T | null>> {
    try {
      const redisClient = this.redisService.getClient();
      if (!redisClient) {
        throw new Error('Redis client not available');
      }

      const fullKeys = keys.map((key) =>
        this.buildKey(key, prefix || this.defaultPrefix),
      );
      const values = await redisClient.mget(...fullKeys);
      console.log(`Cache MGET: ${keys.length} keys`);
      return values.map((value) =>
        value !== null && value !== undefined ? (JSON.parse(value) as T) : null,
      );
    } catch (error) {
      console.error('Cache MGET error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Delete multiple keys at once
   */
  async mdelete(keys: string[], prefix?: string): Promise<number> {
    try {
      const redisClient = this.redisService.getClient();
      if (!redisClient) {
        throw new Error('Redis client not available');
      }

      const fullKeys = keys.map((key) =>
        this.buildKey(key, prefix || this.defaultPrefix),
      );
      const deletedCount = await redisClient.del(...fullKeys);
      console.log(`Cache MDELETE: ${deletedCount}/${keys.length} keys deleted`);
      return deletedCount;
    } catch (error) {
      console.error('Cache MDELETE error:', error);
      return 0;
    }
  }

  /**
   * Clear all cache entries with a specific prefix
   */
  async clearByPrefix(prefix: string): Promise<number> {
    try {
      const redisClient = this.redisService.getClient();
      if (!redisClient) {
        throw new Error('Redis client not available');
      }

      const pattern = `${prefix}:*`;
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`Cache CLEAR by prefix: ${prefix} (${keys.length} keys)`);
      }

      return keys.length;
    } catch (error) {
      console.error(`Cache CLEAR by prefix error for ${prefix}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    try {
      const redisClient = this.redisService.getClient();
      if (!redisClient) {
        throw new Error('Redis client not available');
      }

      const [totalKeys, memoryInfo] = await Promise.all([
        redisClient.dbsize(),
        redisClient.info('memory'),
      ]);

      // Parse memory usage from Redis INFO
      const memoryMatch = memoryInfo.match(/used_memory_human:(\S+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        totalKeys,
        memoryUsage,
      };
    } catch (error) {
      console.error('Cache STATS error:', error);
      return {
        totalKeys: 0,
        memoryUsage: 'unknown',
      };
    }
  }

  /**
   * Build a full cache key with prefix
   */
  private buildKey(key: string, prefix: string): string {
    return `${prefix}:${key}`;
  }

  /**
   * Generate cache keys for common entities
   */
  static generateKey(
    entity: string,
    id: number | string,
    field?: string,
  ): string {
    return field ? `${entity}:${id}:${field}` : `${entity}:${id}`;
  }

  /**
   * Generate cache keys for lists/collections
   */
  static generateListKey(
    entity: string,
    filters?: Record<string, any>,
  ): string {
    if (!filters || Object.keys(filters).length === 0) {
      return `${entity}:list`;
    }

    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(':');

    return `${entity}:list:${filterString}`;
  }

  async onModuleDestroy() {
    // Cleanup if needed
  }
}
