import cache from '../utils/cache.js';

// Cache middleware for GET requests
export const cacheMiddleware = (ttlSeconds = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query parameters
    const cacheKey = `${req.originalUrl}`;
    
    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache HIT for: ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`Cache MISS for: ${cacheKey}`);

    // Store original res.json function
    const originalJson = res.json;

    // Override res.json to cache the response
    res.json = function(data) {
      // Cache the response
      cache.set(cacheKey, data, ttlSeconds);
      console.log(`Cached response for: ${cacheKey}`);
      
      // Call original json function
      return originalJson.call(this, data);
    };

    next();
  };
};

// Middleware to invalidate cache for specific patterns
export const invalidateCache = (patterns = []) => {
  return (req, res, next) => {
    // Store original res.json function
    const originalJson = res.json;

    // Override res.json to invalidate cache after successful operations
    res.json = function(data) {
      // Only invalidate on successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          // Simple pattern matching - you can make this more sophisticated
          const stats = cache.getStats();
          stats.keys.forEach(key => {
            if (key.includes(pattern)) {
              cache.delete(key);
              console.log(`Invalidated cache for: ${key}`);
            }
          });
        });
      }
      
      // Call original json function
      return originalJson.call(this, data);
    };

    next();
  };
};
