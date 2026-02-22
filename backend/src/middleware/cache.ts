import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Проверяем, включен ли Redis
const redisEnabled = process.env.REDIS_ENABLED !== 'false';

let redis: Redis | null = null;

// Middleware для кэширования ответов
export const cacheMiddleware = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Если Redis отключен, пропускаем кэширование
    if (!redis) {
      return next();
    }

    // Пропускаем кэширование для POST, PUT, DELETE запросов
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      // Проверяем кэш
      const cachedResponse = await redis.get(key);
      if (cachedResponse) {
        console.log(`📋 Cache hit for ${req.originalUrl}`);
        const parsed = JSON.parse(cachedResponse);
        return res.json(parsed);
      }

      // Перехватываем ответ для кэширования
      const originalJson = res.json.bind(res);
      res.json = (data: any) => {
        // Кэшируем ответ
        redis!.setex(key, duration, JSON.stringify(data))
          .catch(error => console.error('Cache write error:', error));

        console.log(`💾 Cache stored for ${req.originalUrl} (${duration}s)`);
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Функция для инвалидации кэша
export const invalidateCache = async (pattern: string) => {
  if (!redis) return;

  try {
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Invalidated ${keys.length} cache entries for pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Функция для очистки всего кэша
export const clearAllCache = async () => {
  if (!redis) return;

  try {
    const keys = await redis.keys('cache:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Cleared all ${keys.length} cache entries`);
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

// Функция для получения статистики кэша
export const getCacheStats = async () => {
  if (!redis) return null;

  try {
    const keys = await redis.keys('cache:*');
    const info = await redis.info('memory');

    return {
      totalKeys: keys.length,
      memory: {
        used: info.match(/used_memory:(\d+)/)?.[1],
        peak: info.match(/used_memory_peak:(\d+)/)?.[1],
        rss: info.match(/used_memory_rss:(\d+)/)?.[1]
      },
      uptime: info.match(/uptime_in_seconds:(\d+)/)?.[1]
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return null;
  }
};

// Функция для проверки здоровья Redis
export const checkRedisHealth = async (): Promise<boolean> => {
  if (!redis) return false;

  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
};

if (redisEnabled) {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    lazyConnect: true
  });

  // Подключаемся к Redis
  redis.on('connect', () => {
    console.log('✅ Connected to Redis');
  });

  redis.on('error', (error: any) => {
    console.error('❌ Redis connection error:', error.message);
    console.log('⚠️  Redis disabled, continuing without cache');
    redis = null;
  });
} else {
  console.log('ℹ️  Redis disabled by configuration');
}
