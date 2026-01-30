import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  // Try to load .env.local first, then fall back to .env
  dotenv.config({ path: '.env.local' });
  dotenv.config(); // This will load .env if .env.local doesn't exist
}

import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import cluster from 'cluster';
import os from 'os';

// Import configurations
import connectDB from './config/db.js';
import redisClient from './config/redis.js';
import { configCloudinary } from './config/cloudinary.js';
import initSocket from './socket/index.js';

import { setupSwagger } from './utils/swagger.js';

const PORT = process.env.PORT || 4000;
const WORKER_ID = process.env.pm_id || cluster.worker?.id || 0;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Ultra-performance optimizations
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || Math.max(4, os.cpus().length).toString();

// Enable garbage collection optimization
if (global.gc) {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    if (memUsage.rss > 700 * 1024 * 1024) { // 700MB threshold
      global.gc();
      if (!IS_PRODUCTION) {
        console.log(`🧹 GC triggered - Memory: ${Math.round(memUsage.rss / 1024 / 1024)}MB → ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
      }
    }
  }, 30000);
}

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('warning', (warning) => {
  if (!['MaxListenersExceededWarning', 'DeprecationWarning'].includes(warning.name)) {
    if (!IS_PRODUCTION) {
      console.warn('⚠️ Process warning:', warning.name, warning.message);
    }
  }
});

let server;
let io;

async function gracefulShutdown(signal) {
  if (!IS_PRODUCTION) {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  }
  
  if (server) {
    server.close(() => {
      if (!IS_PRODUCTION) {
        console.log('✅ HTTP server closed');
      }
      process.exit(0);
    });
  }
  
  // Force exit after 10 seconds
  setTimeout(() => {
    if (!IS_PRODUCTION) {
      console.log('⏰ Force exit after timeout');
    }
    process.exit(1);
  }, 10000);
}

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Main server initialization with latest patterns
async function startServer() {
  try {
    const startTime = Date.now();
    
    if (!IS_PRODUCTION) {
      console.log(`🚀 Starting Cenopie Backend Server (Worker ${WORKER_ID})...`);
      console.log(`📊 Node.js: ${process.version}, Platform: ${process.platform}`);
    }

    // Import app after environment setup
    const { default: app } = await import('./app.js');

    // Setup Swagger documentation (development only)
    if (!IS_PRODUCTION) {
      console.log('📚 Setting up API documentation...');
      setupSwagger(app);
    }

    // Ultra-fast MongoDB connection with latest options
    if (!IS_PRODUCTION) {
      console.log('🍃 Connecting to MongoDB...');
    }
    await connectDB();

    // Enhanced Redis connection with error handling
    if (!IS_PRODUCTION) {
      console.log('🗄️ Setting up Redis connection...');
    }
    let pubClient, subClient;
    
    if (process.env.REDIS_DISABLED === 'true') {
      if (!IS_PRODUCTION) {
        console.log('⚠️ Redis disabled - using in-memory adapter');
      }
    } else {
      try {
        if (redisClient && !redisClient.isOpen) {
          await redisClient.connect();
        }
        
        // Create dedicated pub/sub clients for Socket.IO
        pubClient = redisClient?.duplicate();
        subClient = redisClient?.duplicate();
        
        if (pubClient && subClient) {
          await Promise.all([
            pubClient.connect(),
            subClient.connect()
          ]);
          if (!IS_PRODUCTION) {
            console.log('✅ Redis clustering enabled');
          }
        }
      } catch (error) {
        if (!IS_PRODUCTION) {
          console.warn('⚠️ Redis connection failed:', error.message);
          console.log('📝 Continuing without Redis clustering');
        }
        pubClient = subClient = null;
      }
    }

    // Configure Cloudinary with latest settings
    if (!IS_PRODUCTION) {
      console.log('☁️ Configuring Cloudinary...');
    }
    configCloudinary();

    // Create HTTP server with latest Node.js features
    server = createServer(app);

    // Enhanced server settings for large file uploads
    server.keepAliveTimeout = 300000; // 5 minutes
    server.headersTimeout = 310000; // 5 minutes + 10 seconds
    server.maxConnections = 10000;
    server.timeout = 300000; // 5 minutes for large video uploads

    // Initialize Socket.IO with latest configuration
    if (!IS_PRODUCTION) {
      console.log('🔌 Initializing Socket.IO...');
    }
    io = new Server(server, {
      cors: {
        origin: [
          process.env.CLIENT_ORIGIN || 'http://localhost:3000',
          'http://localhost:3000',
          'https://cenopie.com',
          'https://www.cenopie.com'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e6, // 1MB
      allowEIO3: true,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      }
    });

    // Setup Redis adapter if available
    if (pubClient && subClient) {
      try {
        io.adapter(createAdapter(pubClient, subClient));
        if (!IS_PRODUCTION) {
          console.log('✅ Socket.IO Redis adapter configured');
        }
      } catch (error) {
        if (!IS_PRODUCTION) {
          console.warn('⚠️ Redis adapter setup failed:', error.message);
        }
      }
    }

    // Initialize socket handlers
    initSocket(io);

    // Attach Socket.IO instance to Express app for use in controllers
    app.set('io', io);

    // Start server
    server.listen(PORT, () => {
      const bootTime = Date.now() - startTime;
      
      if (IS_PRODUCTION) {
        console.log(`✅ Cenopie Backend Server Started - Port: ${PORT} - Environment: ${process.env.NODE_ENV || 'development'}`);
      } else {
        console.log(`\n🎉 Cenopie Backend Server Started Successfully!`);
        console.log(`🌐 Server: http://localhost:${PORT}`);
        console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
        console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`⚡ Boot time: ${bootTime}ms`);
        console.log(`💾 Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
        console.log(`👷 Worker: ${WORKER_ID}`);
        console.log(`🔌 Socket.IO: ${pubClient ? 'Clustered' : 'Standalone'}`);
      }
    });

    // Enhanced error handling for server
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
      }
    });

    server.on('clientError', (err, socket) => {
      if (!IS_PRODUCTION) {
        console.warn('⚠️ Client error:', err.message);
      }
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();