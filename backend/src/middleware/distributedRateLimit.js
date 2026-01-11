import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis.js';

// Distributed rate limiting using Redis
const createDistributedRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 1000, // requests per window
    message = 'Too many requests from this IP',
    keyPrefix = 'rl:',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  // If Redis is disabled, use memory store (less effective but works)
  const storeConfig = redisClient ? {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: keyPrefix,
    }),
  } : {};

  return rateLimit({
    ...storeConfig,
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: (req) => {
      // Use IP + User ID for authenticated requests
      const ip = req.ip || req.connection.remoteAddress;
      const userId = req.user?.id;
      return userId ? `${ip}:${userId}` : ip;
    },
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
        limit: max,
        windowMs,
      });
    },
  });
};

// Different rate limits for different endpoints
export const apiRateLimit = createDistributedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  keyPrefix: 'rl:api:',
});

export const authRateLimit = createDistributedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  keyPrefix: 'rl:auth:',
  message: 'Too many authentication attempts',
});

export const uploadRateLimit = createDistributedRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  keyPrefix: 'rl:upload:',
  message: 'Too many upload attempts',
});

export const searchRateLimit = createDistributedRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 searches per minute
  keyPrefix: 'rl:search:',
  message: 'Too many search requests',
});

export const messageRateLimit = createDistributedRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  keyPrefix: 'rl:message:',
  message: 'Too many messages sent',
});

// Adaptive rate limiting based on server load
export const adaptiveRateLimit = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const memoryUsagePercent = memUsage.rss / (1024 * 1024 * 1024); // GB
  
  // Reduce rate limits if memory usage is high
  let maxRequests = 1000;
  if (memoryUsagePercent > 1.5) {
    maxRequests = 500; // Reduce by 50%
  } else if (memoryUsagePercent > 1) {
    maxRequests = 750; // Reduce by 25%
  }
  
  // Create dynamic rate limiter
  const dynamicRateLimit = createDistributedRateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    keyPrefix: 'rl:adaptive:',
    message: `Server under high load. Reduced rate limit to ${maxRequests} requests per 15 minutes.`,
  });
  
  dynamicRateLimit(req, res, next);
};

export default {
  apiRateLimit,
  authRateLimit,
  uploadRateLimit,
  searchRateLimit,
  messageRateLimit,
  adaptiveRateLimit,
};