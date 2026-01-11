import logger from '../config/logger.js';

// Performance monitoring middleware optimized for high concurrency
export const performanceMiddleware = (req, res, next) => {
  // Only monitor performance in production or when explicitly enabled
  if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true' || process.env.NODE_ENV === 'production') {
    const startTime = process.hrtime.bigint(); // Higher precision timing
    const startMemory = process.memoryUsage();

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args) {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      const endMemory = process.memoryUsage();
      
      // Log slow requests (>500ms) - reduced threshold for better monitoring
      if (responseTime > 500) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          responseTime: `${responseTime.toFixed(2)}ms`,
          statusCode: res.statusCode,
          memoryDelta: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          },
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      }

      // Add performance headers
      res.set({
        'X-Response-Time': `${responseTime.toFixed(2)}ms`,
        'X-Memory-Usage': `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
      });

      originalEnd.apply(this, args);
    };
  }

  next();
};

// Memory monitoring optimized for high concurrency
export const memoryMonitor = () => {
  // Only run memory monitoring in production or when explicitly enabled
  if (process.env.ENABLE_MEMORY_MONITORING !== 'true' && process.env.NODE_ENV !== 'production') {
    return;
  }

  const interval = setInterval(() => {
    const usage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024),
    };

    // Log memory usage if it's high
    if (memoryUsageMB.heapUsed > 800) { // Increased threshold to 800MB
      logger.warn('High memory usage detected', memoryUsageMB);
    }

    // Force garbage collection if memory is very high
    if (memoryUsageMB.heapUsed > 1500 && global.gc) { // Increased threshold to 1.5GB
      logger.info('Forcing garbage collection');
      global.gc();
    }
  }, 15000); // Check every 15 seconds (reduced from 30)

  // Clean up interval on process exit
  process.on('exit', () => clearInterval(interval));
};

// Request rate monitoring optimized for high concurrency
const requestCounts = new Map();
const rateLimitWindows = new Map();

export const rateMonitor = (req, res, next) => {
  // Only monitor rate in production or when explicitly enabled
  if (process.env.ENABLE_RATE_MONITORING !== 'true' && process.env.NODE_ENV !== 'production') {
    return next();
  }

  const ip = req.ip;
  const now = Date.now();
  const windowKey = `${ip}-${Math.floor(now / 60000)}`; // 1-minute windows

  // Use a sliding window approach for more accurate rate limiting
  if (!rateLimitWindows.has(windowKey)) {
    rateLimitWindows.set(windowKey, new Set());
  }

  const currentWindow = rateLimitWindows.get(windowKey);
  currentWindow.add(now);

  // Clean up old windows (older than 2 minutes)
  const cutoff = now - 120000;
  for (const [key] of rateLimitWindows.entries()) {
    const windowTime = parseInt(key.split('-')[1]) * 60000;
    if (windowTime < cutoff) {
      rateLimitWindows.delete(key);
    }
  }

  // Count requests in the last minute
  let recentRequests = 0;
  for (const [key, timestamps] of rateLimitWindows.entries()) {
    const windowTime = parseInt(key.split('-')[1]) * 60000;
    if (windowTime >= now - 60000) {
      recentRequests += timestamps.size;
    }
  }

  // Log if request rate is high
  if (recentRequests > 200) { // Increased threshold to 200 requests per minute
    logger.warn('High request rate detected', {
      ip,
      requestsPerMinute: recentRequests,
      url: req.originalUrl,
    });
  }

  next();
};

// Periodic cleanup of rate monitoring data
setInterval(() => {
  const now = Date.now();
  const cutoff = now - 120000; // 2 minutes
  
  // Clean up old rate monitoring data
  for (const [key] of rateLimitWindows.entries()) {
    const windowTime = parseInt(key.split('-')[1]) * 60000;
    if (windowTime < cutoff) {
      rateLimitWindows.delete(key);
    }
  }
}, 30000); // Cleanup every 30 seconds