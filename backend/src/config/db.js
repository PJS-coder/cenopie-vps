import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/canopie';
    const IS_PRODUCTION = process.env.NODE_ENV === 'production';
    
    if (!IS_PRODUCTION) {
      console.log('🔗 Connecting to MongoDB:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    }
    
    // Enhanced connection options for high concurrency
    const options = {
      maxPoolSize: process.env.MONGO_MAX_POOL_SIZE || 50, // Increased from 10 to 50
      minPoolSize: process.env.MONGO_MIN_POOL_SIZE || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
      },
      // Connection pool settings for high concurrency
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
    };

    const conn = await mongoose.connect(mongoUri, options);
    
    if (IS_PRODUCTION) {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 MongoDB Pool Status - Current: ${conn.connection.readyState}, Pool Size: ${conn.connection.db.serverConfig?.s?.pool?.totalConnectionCount || 'N/A'}`);
    }
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      if (!IS_PRODUCTION) {
        console.warn('⚠️ MongoDB disconnected');
      }
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      if (!IS_PRODUCTION) {
        console.log('🔄 MongoDB reconnected');
      }
      logger.info('MongoDB reconnected');
    });
    
    // Log connection pool stats periodically
    if (IS_PRODUCTION) {
      setInterval(() => {
        const stats = {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
        };
        logger.info('MongoDB Connection Stats', stats);
      }, 60000); // Every minute
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED') && !IS_PRODUCTION) {
      console.log('💡 MongoDB is not running. Please start MongoDB:');
      console.log('   • macOS: brew services start mongodb-community');
      console.log('   • Linux: sudo systemctl start mongod');
      console.log('   • Windows: Start MongoDB service from Services panel');
    }
    
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;