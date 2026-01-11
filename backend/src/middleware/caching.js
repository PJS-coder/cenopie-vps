import redisClient from '../config/redis.js';

// Cache middleware for API responses
export const cacheMiddleware = (duration = 300) => { // 5 minutes default
  return async (req, res, next) => {
    // Skip if Redis is disabled
    if (!redisClient) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated requests with sensitive data
    const skipPaths = ['/api/auth', '/api/user/profile', '/api/messages'];
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Generate cache key
    const cacheKey = `cache:${req.originalUrl}:${req.user?.id || 'anonymous'}`;

    try {
      // Check if cached response exists
      const cachedResponse = await redisClient.get(cacheKey);
      
      if (cachedResponse) {
        const parsed = JSON.parse(cachedResponse);
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-TTL', await redisClient.ttl(cacheKey));
        return res.status(parsed.status).json(parsed.data);
      }

      // Store original res.json method
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = {
            status: res.statusCode,
            data: data,
            timestamp: Date.now()
          };

          // Cache asynchronously (don't wait)
          redisClient.setEx(cacheKey, duration, JSON.stringify(responseData))
            .catch(err => console.error('Cache set error:', err));
        }

        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
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
    const keys = await redisClient.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidated ${keys.length} cache entries for pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Specific cache invalidation functions
export const invalidateUserCache = (userId) => {
  return invalidateCache(`*:${userId}`);
};

export const invalidateJobCache = () => {
  return invalidateCache('/api/jobs*');
};

export const invalidateCompanyCache = (companyId) => {
  return invalidateCache(`/api/companies/${companyId}*`);
};

// Cache warming for frequently accessed data
export const warmCache = async () => {
  console.log('🔥 Starting cache warming...');
  
  try {
    // Warm popular endpoints (implement based on your analytics)
    const popularEndpoints = [
      '/api/jobs?page=1&limit=20',
      '/api/companies?page=1&limit=20',
      '/api/jobs/featured',
    ];

    for (const endpoint of popularEndpoints) {
      // You would make internal requests to warm these endpoints
      console.log(`Warming cache for: ${endpoint}`);
    }
    
    console.log('✅ Cache warming completed');
  } catch (error) {
    console.error('Cache warming error:', error);
  }
};

// Session caching for user data
export const cacheUserSession = async (userId, userData, ttl = 3600) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    const sessionKey = `session:${userId}`;
    await redisClient.setEx(sessionKey, ttl, JSON.stringify(userData));
  } catch (error) {
    console.error('Session cache error:', error);
  }
};

export const getUserSession = async (userId) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return null;
    }
    const sessionKey = `session:${userId}`;
    const cached = await redisClient.get(sessionKey);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
};

// Real-time data caching for dashboards
export const cacheRealtimeData = async (key, data, ttl = 60) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    await redisClient.setEx(`realtime:${key}`, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Realtime cache error:', error);
  }
};

export const getRealtimeData = async (key) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return null;
    }
    const cached = await redisClient.get(`realtime:${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Realtime data retrieval error:', error);
    return null;
  }
};

export default {
  cacheMiddleware,
  invalidateCache,
  invalidateUserCache,
  invalidateJobCache,
  invalidateCompanyCache,
  warmCache,
  cacheUserSession,
  getUserSession,
  cacheRealtimeData,
  getRealtimeData,
};