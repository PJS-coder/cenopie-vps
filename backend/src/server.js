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

    // Connect to Redis
    console.log('🗄️ Connecting to Redis...');
    try {
      await redisClient.connect();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.warn('⚠️ Redis connection failed:', error.message);
      if (error.message.includes('ECONNREFUSED')) {
        console.log('💡 Redis is not running. Please start Redis:');
        console.log('   • macOS: brew services start redis');
        console.log('   • Linux: sudo systemctl start redis');
        console.log('   • Windows: Download and install Redis from official website');
      }
      console.log('📝 Server will continue without Redis caching');
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
          'https://cenopie-production.vercel.app'
        ],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
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
        if (redisClient.isOpen) {
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