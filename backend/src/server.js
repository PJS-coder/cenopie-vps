import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import redisClient from './config/redis.js';
import { configCloudinary } from './config/cloudinary.js';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import initSocket from './socket/index.js';
import cluster from 'cluster';
import ultraMonitor from './utils/ultra-monitor.js';

const PORT = process.env.PORT || 4000;
const WORKER_ID = process.env.pm_id || cluster.worker?.id || 0;

// Ultra-performance optimizations
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '16';

// Enable garbage collection if available
if (global.gc) {
  // Run GC every 30 seconds in production
  setInterval(() => {
    if (process.memoryUsage().rss > 700 * 1024 * 1024) { // 700MB threshold
      global.gc();
    }
  }, 30000);
}

// Ultra-performance process optimizations
process.on('warning', (warning) => {
  if (warning.name !== 'MaxListenersExceededWarning') {
    console.warn('⚠️ Process warning:', warning);
  }
});

// Main server function with ultra-performance optimizations
(async () => {
  try {
    const startTime = Date.now();
    console.log(`🚀 Starting Cenopie Backend Server (Worker ${WORKER_ID})...`);

    const app = (await import('./app.js')).default;

    // Initialize ultra-performance monitoring
    console.log('📊 Initializing ultra-performance monitoring...');
    app.use(ultraMonitor.requestMonitor());

    // Ultra-fast MongoDB connection
    console.log('📊 Connecting to MongoDB with ultra-performance settings...');
    await connectDB();

    // Ultra-fast Redis connection with clustering support
    console.log('🗄️ Connecting to Redis with clustering support...');
    let pubClient, subClient;
    
    if (process.env.REDIS_DISABLED === 'true' || !redisClient) {
      console.log('⚠️ Redis disabled - Socket.IO will use in-memory adapter');
    } else {
      try {
        await redisClient.connect();
        
        // Create pub/sub clients for Socket.IO clustering
        pubClient = redisClient.duplicate();
        subClient = redisClient.duplicate();
        
        await pubClient.connect();
        await subClient.connect();
        
        console.log('✅ Redis connected with clustering support');
      } catch (error) {
        console.warn('⚠️ Redis connection failed:', error.message);
        console.log('📝 Server will continue without Redis clustering');
      }
    }

    // Configure Cloudinary
    console.log('☁️ Configuring Cloudinary...');
    configCloudinary();

    // Create ultra-performance HTTP server
    const server = app.listen(PORT, () => {
      const bootTime = Date.now() - startTime;
      console.log(`✅ Server running on port ${PORT} (Worker ${WORKER_ID})`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⚡ Boot time: ${bootTime}ms`);
      console.log(`💾 Memory usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
    });

    // Ultra-performance server settings
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000;   // 66 seconds
    server.maxConnections = 10000;   // High connection limit
    server.timeout = 120000;         // 2 minutes timeout

    // Initialize ultra-performance Socket.IO
    console.log('🔌 Initializing ultra-performance Socket.IO...');
    const io = new Server(server, {
      cors: {
        origin: [
          process.env.CLIENT_ORIGIN || 'http://localhost:3000',
          'http://localhost:3000',
          'http://localhost:3001',
          'https://cenopie.com',
          'https://www.cenopie.com',
          'https://cenopie-production.vercel.app',
          'https://cenopie-cpanel-vercel.vercel.app',
          /https?:\/\/cenopie-.*-pjs-coders-projects.vercel.app$/,
          /https?:\/\/cenopie-production-.*.vercel.app$/,
          /https?:\/\/cenopie-.*\.vercel\.app$/
        ],
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling'], // Enable both for maximum performance
      upgradeTimeout: 3000,
      pingTimeout: 20000,
      pingInterval: 10000,
      maxHttpBufferSize: 1e6,  // 1MB max message size
      allowEIO3: true,
      
      // Ultra-performance settings
      perMessageDeflate: {
        threshold: 1024,
        concurrencyLimit: 10,
        memLevel: 7
      },
      httpCompression: {
        threshold: 1024,
        chunkSize: 8 * 1024,
        windowBits: 13,
        memLevel: 7
      }
    });

    // Enable Redis adapter for clustering if available
    if (pubClient && subClient) {
      io.adapter(createAdapter(pubClient, subClient, {
        key: 'socket.io',
        requestsTimeout: 1000
      }));
      console.log('✅ Socket.IO Redis adapter enabled for clustering');
    }

    // Ultra-fast connection ID generation
    io.engine.generateId = () => {
      return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
    };

    // Attach io to global object
    global.io = io;

    // Initialize ultra-performance socket handlers
    initSocket(io);
    console.log('✅ Ultra-performance Socket.IO initialized');

    // Ultra-performance error handling
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      
      // Attempt graceful recovery
      if (err.code === 'EADDRINUSE') {
        console.log('🔄 Port in use, attempting recovery...');
        setTimeout(() => {
          server.close();
          server.listen(PORT);
        }, 1000);
      }
    });

    server.on('clientError', (err, socket) => {
      console.warn('⚠️ Client error:', err.message);
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

    // Ultra-performance monitoring (replaced with ultraMonitor)
    console.log('✅ Ultra-performance monitoring active');

    // Ultra-fast graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 ${signal} received, shutting down gracefully (Worker ${WORKER_ID})...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        // Close Socket.IO
        io.close(() => {
          console.log('🔌 Socket.IO closed');
        });

        // Close Redis connections
        try {
          if (redisClient && redisClient.isOpen) {
            await redisClient.quit();
          }
          if (pubClient && pubClient.isOpen) {
            await pubClient.quit();
          }
          if (subClient && subClient.isOpen) {
            await subClient.quit();
          }
          console.log('🗄️ Redis connections closed');
        } catch (error) {
          console.warn('⚠️ Redis quit error:', error.message);
        }

        // Stop ultra-performance monitoring
        ultraMonitor.stop();

        console.log(`👋 Server shutdown complete (Worker ${WORKER_ID})`);
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // PM2 reload

    const totalBootTime = Date.now() - startTime;
    console.log(`🎉 Ultra-performance server startup complete! (${totalBootTime}ms)`);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();