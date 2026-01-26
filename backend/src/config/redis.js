import { createClient } from 'redis';

// Skip Redis entirely if disabled
if (process.env.REDIS_DISABLED === 'true') {
  console.log('Redis is disabled');
} 

const redisClient = process.env.REDIS_DISABLED === 'true' ? null : createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 1000,     // Ultra-fast connection timeout
    keepAlive: 30000,
    reconnectStrategy: (retries) => {
      // Ultra-fast reconnection strategy
      if (retries > 2) {
        console.log('Redis: Max retries reached, giving up');
        return false;
      }
      return Math.min(retries * 500, 1000); // Faster reconnection
    }
  },
  database: 0,
  disableOfflineQueue: true,
  enableOfflineQueue: false,
  retryUnfulfilledCommands: false,
  maxRetriesPerRequest: 1,
  
  // Ultra-performance Redis settings
  commandsQueueMaxLength: 10000,  // High command queue
  lazyConnect: true,              // Connect only when needed
  
  // Connection pooling for performance
  isolationPoolOptions: {
    min: 5,    // Minimum connections
    max: 50    // Maximum connections for high load
  }
});

// Enhanced event handlers only if Redis client exists
if (redisClient) {
  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err.message);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });

  redisClient.on('ready', () => {
    console.log('Redis Client Ready');
  });

  redisClient.on('reconnecting', () => {
    console.log('Redis Client Reconnecting');
  });
}

export default redisClient;