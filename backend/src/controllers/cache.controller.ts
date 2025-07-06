import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { CacheService } from '../services/cache.service';

interface CacheSetRequest {
  key: string;
  value: any;
  ttl?: number;
  prefix?: string;
}

interface CacheMsetRequest {
  keyValuePairs: Array<{ key: string; value: any }>;
  ttl?: number;
  prefix?: string;
}

@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Post('set')
  async set(@Body() request: CacheSetRequest) {
    await this.cacheService.set(request.key, request.value, {
      ttl: request.ttl,
      prefix: request.prefix,
    });
    return { message: 'Value set successfully', key: request.key };
  }

  @Get('get/:key')
  async get(
    @Param('key') key: string,
    @Query('prefix') prefix?: string,
  ) {
    const value = await this.cacheService.get(key, prefix);
    return { key, value, exists: value !== null };
  }

  @Delete('delete/:key')
  async delete(
    @Param('key') key: string,
    @Query('prefix') prefix?: string,
  ) {
    const success = await this.cacheService.delete(key, prefix);
    return { key, deleted: success };
  }

  @Get('exists/:key')
  async exists(
    @Param('key') key: string,
    @Query('prefix') prefix?: string,
  ) {
    const exists = await this.cacheService.exists(key, prefix);
    return { key, exists };
  }

  @Post('mset')
  async mset(@Body() request: CacheMsetRequest) {
    await this.cacheService.mset(request.keyValuePairs, {
      ttl: request.ttl,
      prefix: request.prefix,
    });
    return {
      message: 'Multiple values set successfully',
      count: request.keyValuePairs.length,
    };
  }

  @Post('mget')
  async mget(@Body() request: { keys: string[]; prefix?: string }) {
    const values = await this.cacheService.mget(request.keys, request.prefix);
    return {
      keys: request.keys,
      values,
      hits: values.filter(v => v !== null).length,
      misses: values.filter(v => v === null).length,
    };
  }

  @Post('mdelete')
  async mdelete(@Body() request: { keys: string[]; prefix?: string }) {
    const deletedCount = await this.cacheService.mdelete(request.keys, request.prefix);
    return {
      keys: request.keys,
      deletedCount,
      totalKeys: request.keys.length,
    };
  }

  @Delete('clear/:prefix')
  async clearByPrefix(@Param('prefix') prefix: string) {
    const deletedCount = await this.cacheService.clearByPrefix(prefix);
    return {
      prefix,
      deletedCount,
      message: `Cleared ${deletedCount} keys with prefix '${prefix}'`,
    };
  }

  @Get('stats')
  async getStats() {
    const stats = await this.cacheService.getStats();
    return {
      ...stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test')
  async testCache() {
    // Test basic operations
    const testKey = 'test:basic';
    const testValue = { message: 'Hello from cache!', timestamp: Date.now() };

    // Set value
    await this.cacheService.set(testKey, testValue, { ttl: 60000, prefix: 'test' });

    // Get value
    const retrieved = await this.cacheService.get(testKey, 'test');

    // Check exists
    const exists = await this.cacheService.exists(testKey, 'test');

    // Delete value
    const deleted = await this.cacheService.delete(testKey, 'test');

    return {
      testKey,
      originalValue: testValue,
      retrievedValue: retrieved,
      exists,
      deleted,
      success: JSON.stringify(retrieved) === JSON.stringify(testValue) && exists && deleted,
    };
  }
} 