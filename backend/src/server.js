import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import redisClient from './config/redis.js';
import { configCloudinary } from './config/cloudinary.js';
import { Server } from 'socket.io';
import initSocket from './socket/index.js';
const PORT = process.env.PORT || 4000;

// Main server function
(async () => {
  try {
    console.log('🚀 Starting Cenopie Backend Server...');

    const app = (await import('./app.js')).default;

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await connectDB();

    // Connect to Redis (skip if disabled)
    console.log('🗄️ Connecting to Redis...');
    if (process.env.REDIS_DISABLED === 'true' || !redisClient) {
      console.log('⚠️ Redis disabled or not configured - skipping Redis connection');
      console.log('📝 Server will continue without Redis caching');
    } else {
      try {
        await redisClient.connect();
        console.log('✅ Redis connected successfully');
      } catch (error) {
        console.warn('⚠️ Redis connection failed:', error.message);
        console.log('📝 Server will continue without Redis caching');
      }
    }

    // Configure Cloudinary
    console.log('☁️ Configuring Cloudinary...');
    configCloudinary();

    // Create HTTP server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Initialize Socket.IO
    console.log('🔌 Initializing Socket.IO...');
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
      transports: ['polling'], // Use only polling for cPanel compatibility
      pingTimeout: 60000,
      pingInterval: 25000,
      allowEIO3: true,
      // cPanel-specific options
      upgrade: false,
      rememberUpgrade: false,
    });

    // Attach io to global object so it can be accessed in controllers
    global.io = io;

    // Initialize socket event handlers
    initSocket(io);
    console.log('✅ Socket.IO initialized');

    // Handle server errors
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 ${signal} received, shutting down gracefully...`);

      server.close(() => {
        console.log('🔌 HTTP server closed');
      });

      try {
        if (redisClient && redisClient.isOpen) {
          await redisClient.quit();
          console.log('🗄️ Redis connection closed');
        }
      } catch (error) {
        console.warn('⚠️ Redis quit error:', error.message);
      }

      console.log('👋 Server shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    console.log('🎉 Server startup complete!');

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();