import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

// Cache middleware for API responses
export const cacheMiddleware = (duration = 300) => { // 5 minutes default
  return async (req, res, next) => {
    // Skip if Redis is disabled
    if (!redisClient) {
      return next();
    }

    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and user ID
    const userId = req.user?.id || 'anonymous';
    const cacheKey = `cache:${req.originalUrl}:${userId}`;

    try {
      // Try to get cached response
      const cachedResponse = await redisClient.get(cacheKey);
      
      if (cachedResponse) {
        logger.info(`Cache hit for ${cacheKey}`);
        const parsed = JSON.parse(cachedResponse);
        return res.status(parsed.status).json(parsed.data);
      }

      // Store original res.json method
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cacheData = {
            status: res.statusCode,
            data: data
          };
          
          redisClient.setEx(cacheKey, duration, JSON.stringify(cacheData))
            .catch(err => logger.error('Cache set error:', err));
        }

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

// Cache invalidation helper
export const invalidateCache = async (pattern) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Invalidated ${keys.length} cache entries matching ${pattern}`);
    }
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};

// Batch cache operations
export const batchCacheSet = async (entries) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    const pipeline = redisClient.multi();
    
    entries.forEach(({ key, value, ttl = 300 }) => {
      pipeline.setEx(key, ttl, JSON.stringify(value));
    });
    
    await pipeline.exec();
    logger.info(`Batch cached ${entries.length} entries`);
  } catch (error) {
    logger.error('Batch cache error:', error);
  }
};