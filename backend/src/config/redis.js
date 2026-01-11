import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_DISABLED ? null : (process.env.REDIS_URL || 'redis://localhost:6379'),
  socket: {
    connectTimeout: 10000,
    keepAlive: 30000,
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  },
  database: 0,
  // Performance settings for high concurrency
  disableOfflineQueue: false,
  enableOfflineQueue: true,
  retryUnfulfilledCommands: true,
  maxRetriesPerRequest: 3,
});

// Enhanced event handlers
redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
  console.log('Redis Client Ready');
  // Log Redis info in production
  if (process.env.NODE_ENV === 'production') {
    redisClient.info().then(info => {
      console.log('Redis Info:', info.split('\n').filter(line => 
        line.includes('connected_clients') || 
        line.includes('used_memory') || 
        line.includes('total_connections_received')
      ).join(', '));
    }).catch(err => {
      console.error('Failed to get Redis info:', err.message);
    });
  }
});

redisClient.on('reconnecting', () => {
  console.log('Redis Client Reconnecting');
});

// Add connection pool monitoring
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    if (redisClient.isOpen) {
      redisClient.ping().then(result => {
        console.log('Redis Ping Response:', result);
      }).catch(err => {
        console.error('Redis Ping Error:', err.message);
      });
    }
  }, 30000); // Every 30 seconds
}

export default redisClient;