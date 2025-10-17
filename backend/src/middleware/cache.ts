import { Request, Response, NextFunction } from 'express';
import { cache } from '../config/redis';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
  varyBy?: string[]; // Headers to vary cache by
}

// Default cache key generator
const defaultKeyGenerator = (req: Request): string => {
  const { method, originalUrl, query, body } = req;
  const userId = (req as any).user?.id || 'anonymous';
  
  // Create a hash of the request data
  const requestData = {
    method,
    url: originalUrl,
    query,
    body: method === 'POST' || method === 'PUT' ? body : undefined,
    userId
  };
  
  return crypto
    .createHash('md5')
    .update(JSON.stringify(requestData))
    .digest('hex');
};

// Cache middleware factory
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false,
    varyBy = []
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET' || skipCache(req)) {
      return next();
    }

    try {
      // Generate cache key
      let cacheKey = `api:${keyGenerator(req)}`;
      
      // Add vary headers to cache key
      if (varyBy.length > 0) {
        const varyValues = varyBy.map(header => req.get(header) || '').join(':');
        cacheKey += `:${crypto.createHash('md5').update(varyValues).digest('hex')}`;
      }

      // Try to get from cache
      const cachedResponse = await cache.get(cacheKey);
      
      if (cachedResponse) {
        const parsed = JSON.parse(cachedResponse);
        
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${ttl}`,
          'ETag': parsed.etag
        });
        
        return res.status(parsed.status).json(parsed.data);
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data: any) {
        const status = res.statusCode;
        
        // Only cache successful responses
        if (status >= 200 && status < 300) {
          const etag = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
          
          const cacheData = {
            status,
            data,
            etag,
            timestamp: Date.now()
          };
          
          // Cache asynchronously (don't wait)
          cache.set(cacheKey, JSON.stringify(cacheData), ttl).catch(err => {
            console.error('Cache set error:', err);
          });
          
          // Set cache headers
          res.set({
            'X-Cache': 'MISS',
            'Cache-Control': `public, max-age=${ttl}`,
            'ETag': etag
          });
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

// Specific cache configurations for different endpoints
export const cacheConfigs = {
  // Long-term cache for static data
  static: cacheMiddleware({
    ttl: 3600, // 1 hour
    skipCache: () => false
  }),
  
  // Medium-term cache for semi-static data
  semiStatic: cacheMiddleware({
    ttl: 900, // 15 minutes
    varyBy: ['Accept-Language']
  }),
  
  // Short-term cache for dynamic data
  dynamic: cacheMiddleware({
    ttl: 300, // 5 minutes
    varyBy: ['Accept-Language', 'Authorization']
  }),
  
  // User-specific cache
  userSpecific: cacheMiddleware({
    ttl: 600, // 10 minutes
    keyGenerator: (req) => {
      const userId = (req as any).user?.id || 'anonymous';
      return `user:${userId}:${req.originalUrl}:${JSON.stringify(req.query)}`;
    },
    varyBy: ['Accept-Language']
  }),
  
  // Search results cache
  search: cacheMiddleware({
    ttl: 1800, // 30 minutes
    keyGenerator: (req) => {
      const { q, type, kitchen, ...otherParams } = req.query;
      return `search:${q}:${type}:${kitchen}:${JSON.stringify(otherParams)}`;
    },
    varyBy: ['Accept-Language']
  })
};

// Cache invalidation utilities
export const cacheInvalidation = {
  // Invalidate all caches for a specific pattern
  invalidatePattern: async (pattern: string): Promise<void> => {
    try {
      // Note: This requires Redis SCAN command for production use
      // For now, we'll implement a simple key tracking system
      console.log(`Cache invalidation requested for pattern: ${pattern}`);
      // TODO: Implement pattern-based cache invalidation
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  },
  
  // Invalidate user-specific caches
  invalidateUser: async (userId: string): Promise<void> => {
    try {
      await cache.del(`user:${userId}:*`);
    } catch (error) {
      console.error('User cache invalidation error:', error);
    }
  },
  
  // Invalidate meal-related caches
  invalidateMeals: async (): Promise<void> => {
    try {
      // Invalidate common meal-related cache keys
      const patterns = [
        'api:*meals*',
        'api:*suggestions*',
        'search:*'
      ];
      
      for (const pattern of patterns) {
        await cacheInvalidation.invalidatePattern(pattern);
      }
    } catch (error) {
      console.error('Meal cache invalidation error:', error);
    }
  }
};