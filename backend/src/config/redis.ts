import { createClient, RedisClientType } from 'redis';

const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
};

export const redisClient: RedisClientType = createClient(redisConfig);

// Error handling
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connection established');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('end', () => {
  console.log('🔄 Redis connection closed');
});

// Connect to Redis
export const connectRedis = async (): Promise<boolean> => {
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing Redis connection...');
  await redisClient.quit();
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing Redis connection...');
  await redisClient.quit();
});

// Cache utilities
export const cache = {
  get: async (key: string): Promise<string | null> => {
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  set: async (key: string, value: string, ttlSeconds?: number): Promise<boolean> => {
    try {
      if (ttlSeconds) {
        await redisClient.setEx(key, ttlSeconds, value);
      } else {
        await redisClient.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  },

  del: async (key: string): Promise<boolean> => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  },

  exists: async (key: string): Promise<boolean> => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  },
};