import { createClient } from 'redis';

// Skip Redis entirely if disabled
if (process.env.REDIS_DISABLED === 'true') {
  console.log('Redis is disabled');
} 

const redisClient = process.env.REDIS_DISABLED === 'true' ? null : createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    keepAlive: 30000,
    reconnectStrategy: (retries) => {
      // Stop retrying after 3 attempts
      if (retries > 3) {
        console.log('Redis: Max retries reached, giving up');
        return false;
      }
      return Math.min(retries * 1000, 3000);
    }
  },
  database: 0,
  disableOfflineQueue: true,
  enableOfflineQueue: false,
  retryUnfulfilledCommands: false,
  maxRetriesPerRequest: 1,
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