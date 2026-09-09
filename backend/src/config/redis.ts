import Redis, { RedisOptions } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

export function getRedisOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

export function getRedisConnection(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, getRedisOptions());

    redisClient.on('connect', () => {
      logger.info('✅ Connected to Redis');
    });

    redisClient.on('error', (err) => {
      logger.warn({ error: err.message }, '⚠️ Redis connection error');
    });
  }

  return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('🔌 Closed Redis connection');
  }
}
