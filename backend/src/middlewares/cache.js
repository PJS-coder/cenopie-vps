import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

// Ultra-performance multi-level cache system
class UltraCache {
  constructor() {
    // L1 Cache: In-memory (fastest)
    this.l1Cache = new Map();
    this.l1MaxSize = 10000;
    this.l1TTL = 60000; // 1 minute
    
    // L2 Cache: Redis (fast)
    this.l2Client = redisClient;
    this.l2TTL = 900000; // 15 minutes
    
    // Cache statistics
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
    
    this.startCleanup();
    this.startMonitoring();
  }
  
  // Ultra-fast get with multi-level fallback
  async get(key) {
    try {
      // L1 Cache check (in-memory) - Ultra fast
      const l1Data = this.l1Cache.get(key);
      if (l1Data && Date.now() - l1Data.timestamp < this.l1TTL) {
        this.stats.l1Hits++;
        return l1Data.data;
      }
      
      // L2 Cache check (Redis) - Fast
      if (this.l2Client && this.l2Client.isOpen) {
        try {
          const l2Data = await this.l2Client.get(key);
          if (l2Data) {
            const parsed = JSON.parse(l2Data);
            this.stats.l2Hits++;
            
            // Promote to L1 cache
            this.setL1(key, parsed);
            return parsed;
          }
        } catch (error) {
          logger.warn('L2 cache get error:', error.message);
        }
      }
      
      // Cache miss
      this.stats.misses++;
      return null;
      
    } catch (error) {
      logger.error('Ultra cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }
  
  // Ultra-fast set with intelligent distribution
  async set(key, data, ttl = null) {
    try {
      this.stats.sets++;
      
      // Always set in L1 cache
      this.setL1(key, data);
      
      // Set in L2 cache (Redis) if available
      if (this.l2Client && this.l2Client.isOpen) {
        try {
          const redisTTL = ttl || Math.floor(this.l2TTL / 1000);
          await this.l2Client.setEx(key, redisTTL, JSON.stringify(data));
        } catch (error) {
          logger.warn('L2 cache set error:', error.message);
        }
      }
      
      return true;
      
    } catch (error) {
      logger.error('Ultra cache set error:', error);
      return false;
    }
  }
  
  // Set L1 cache with intelligent eviction
  setL1(key, data) {
    // Evict oldest if at capacity
    if (this.l1Cache.size >= this.l1MaxSize) {
      const firstKey = this.l1Cache.keys().next().value;
      this.l1Cache.delete(firstKey);
      this.stats.evictions++;
    }
    
    this.l1Cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  // Ultra-fast delete from all levels
  async del(key) {
    try {
      // Delete from L1
      this.l1Cache.delete(key);
      
      // Delete from L2
      if (this.l2Client && this.l2Client.isOpen) {
        await this.l2Client.del(key);
      }
      
      return true;
    } catch (error) {
      logger.error('Ultra cache delete error:', error);
      return false;
    }
  }
  
  // Pattern-based cache invalidation
  async invalidatePattern(pattern) {
    try {
      // Invalidate L1 cache
      for (const key of this.l1Cache.keys()) {
        if (key.includes(pattern)) {
          this.l1Cache.delete(key);
        }
      }
      
      // Invalidate L2 cache
      if (this.l2Client && this.l2Client.isOpen) {
        const keys = await this.l2Client.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.l2Client.del(keys);
        }
      }
      
      logger.info(`Cache invalidated for pattern: ${pattern}`);
      return true;
      
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      return false;
    }
  }
  
  // Batch operations for maximum performance
  async mget(keys) {
    const results = {};
    const missedKeys = [];
    
    // Check L1 cache first
    for (const key of keys) {
      const l1Data = this.l1Cache.get(key);
      if (l1Data && Date.now() - l1Data.timestamp < this.l1TTL) {
        results[key] = l1Data.data;
        this.stats.l1Hits++;
      } else {
        missedKeys.push(key);
      }
    }
    
    // Check L2 cache for missed keys
    if (missedKeys.length > 0 && this.l2Client && this.l2Client.isOpen) {
      try {
        const l2Results = await this.l2Client.mGet(missedKeys);
        
        for (let i = 0; i < missedKeys.length; i++) {
          const key = missedKeys[i];
          const value = l2Results[i];
          
          if (value) {
            const parsed = JSON.parse(value);
            results[key] = parsed;
            this.stats.l2Hits++;
            
            // Promote to L1
            this.setL1(key, parsed);
          } else {
            this.stats.misses++;
          }
        }
      } catch (error) {
        logger.warn('L2 cache mget error:', error.message);
        this.stats.misses += missedKeys.length;
      }
    } else {
      this.stats.misses += missedKeys.length;
    }
    
    return results;
  }
  
  // Batch set operations
  async mset(keyValuePairs, ttl = null) {
    try {
      const operations = [];
      
      // Set in L1 cache
      for (const [key, value] of Object.entries(keyValuePairs)) {
        this.setL1(key, value);
        this.stats.sets++;
      }
      
      // Set in L2 cache
      if (this.l2Client && this.l2Client.isOpen) {
        const redisTTL = ttl || Math.floor(this.l2TTL / 1000);
        
        for (const [key, value] of Object.entries(keyValuePairs)) {
          operations.push(['setEx', key, redisTTL, JSON.stringify(value)]);
        }
        
        if (operations.length > 0) {
          const pipeline = this.l2Client.multi();
          operations.forEach(([command, ...args]) => {
            pipeline[command](...args);
          });
          await pipeline.exec();
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Ultra cache mset error:', error);
      return false;
    }
  }
  
  // Cache warming for critical data
  async warmCache(warmingData) {
    try {
      logger.info('Starting cache warming...');
      
      for (const [key, data] of Object.entries(warmingData)) {
        await this.set(key, data, 3600); // 1 hour TTL for warmed data
      }
      
      logger.info(`Cache warmed with ${Object.keys(warmingData).length} entries`);
      return true;
      
    } catch (error) {
      logger.error('Cache warming error:', error);
      return false;
    }
  }
  
  // Intelligent cache cleanup
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      // Clean expired L1 entries
      for (const [key, value] of this.l1Cache.entries()) {
        if (now - value.timestamp > this.l1TTL) {
          this.l1Cache.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        logger.info(`L1 cache cleanup: removed ${cleaned} expired entries`);
      }
      
      // Force cleanup if cache is too large
      if (this.l1Cache.size > this.l1MaxSize * 1.2) {
        const entries = Array.from(this.l1Cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toRemove = entries.slice(0, Math.floor(this.l1MaxSize * 0.2));
        toRemove.forEach(([key]) => {
          this.l1Cache.delete(key);
          this.stats.evictions++;
        });
        
        logger.info(`L1 cache forced cleanup: removed ${toRemove.length} oldest entries`);
      }
      
    }, 60000); // Clean every minute
  }
  
  // Performance monitoring
  startMonitoring() {
    setInterval(() => {
      const totalRequests = this.stats.l1Hits + this.stats.l2Hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? 
        ((this.stats.l1Hits + this.stats.l2Hits) / totalRequests * 100).toFixed(2) : 0;
      const l1HitRate = totalRequests > 0 ? 
        (this.stats.l1Hits / totalRequests * 100).toFixed(2) : 0;
      
      logger.info(`📊 Ultra Cache Performance:`);
      logger.info(`├─ Total Requests: ${totalRequests}`);
      logger.info(`├─ Overall Hit Rate: ${hitRate}%`);
      logger.info(`├─ L1 Hit Rate: ${l1HitRate}%`);
      logger.info(`├─ L1 Cache Size: ${this.l1Cache.size}/${this.l1MaxSize}`);
      logger.info(`├─ Cache Sets: ${this.stats.sets}`);
      logger.info(`└─ Evictions: ${this.stats.evictions}`);
      
      // Reset stats periodically to prevent overflow
      if (totalRequests > 1000000) {
        this.stats.l1Hits = Math.floor(this.stats.l1Hits / 2);
        this.stats.l2Hits = Math.floor(this.stats.l2Hits / 2);
        this.stats.misses = Math.floor(this.stats.misses / 2);
        this.stats.sets = Math.floor(this.stats.sets / 2);
        this.stats.evictions = Math.floor(this.stats.evictions / 2);
      }
      
    }, 300000); // Report every 5 minutes
  }
  
  // Get cache statistics
  getStats() {
    const totalRequests = this.stats.l1Hits + this.stats.l2Hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? 
      ((this.stats.l1Hits + this.stats.l2Hits) / totalRequests * 100) : 0;
    
    return {
      ...this.stats,
      totalRequests,
      hitRate,
      l1Size: this.l1Cache.size,
      l1MaxSize: this.l1MaxSize
    };
  }
  
  // Clear all caches
  async clear() {
    try {
      // Clear L1
      this.l1Cache.clear();
      
      // Clear L2
      if (this.l2Client && this.l2Client.isOpen) {
        await this.l2Client.flushDb();
      }
      
      logger.info('All caches cleared');
      return true;
      
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }
}

// Create singleton instance
const ultraCache = new UltraCache();

// Cache middleware for API responses with ultra-performance
export const ultraCacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Create intelligent cache key
    const userId = req.user?.id || 'anonymous';
    const cacheKey = `api:${req.originalUrl}:${userId}:${req.get('Accept-Language') || 'en'}`;
    
    try {
      // Try to get cached response
      const cachedResponse = await ultraCache.get(cacheKey);
      
      if (cachedResponse) {
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${duration}`
        });
        
        return res.status(cachedResponse.status).json(cachedResponse.data);
      }
      
      // Store original res.json method
      const originalJson = res.json;
      
      // Override res.json to cache the response
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cacheData = {
            status: res.statusCode,
            data: data,
            timestamp: Date.now()
          };
          
          // Cache asynchronously for performance
          setImmediate(async () => {
            await ultraCache.set(cacheKey, cacheData, duration);
          });
          
          // Add cache headers
          res.set({
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey,
            'Cache-Control': `public, max-age=${duration}`
          });
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
      
    } catch (error) {
      logger.error('Ultra cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

// Cache invalidation helper with pattern support
export const invalidateUltraCache = async (pattern) => {
  try {
    await ultraCache.invalidatePattern(pattern);
    logger.info(`Ultra cache invalidated for pattern: ${pattern}`);
  } catch (error) {
    logger.error('Ultra cache invalidation error:', error);
  }
};

// Batch cache operations
export const batchUltraCacheSet = async (entries) => {
  try {
    const keyValuePairs = {};
    entries.forEach(({ key, value }) => {
      keyValuePairs[key] = value;
    });
    
    await ultraCache.mset(keyValuePairs);
    logger.info(`Batch cached ${entries.length} entries`);
  } catch (error) {
    logger.error('Batch ultra cache error:', error);
  }
};

// Export the ultra cache instance
export default ultraCache;