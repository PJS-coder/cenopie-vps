import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { initMessageSocket } from './messageSocket.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import logger from '../config/logger.js';

let ioInstance = null;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Ultra-performance message queue for reliability
class UltraMessageQueue {
  constructor() {
    this.client = null;
    this.isProcessing = false;
    this.batchSize = 100;
    this.processingInterval = 10; // 10ms intervals for ultra-fast processing
    this.setupRedisClient();
  }
  
  async setupRedisClient() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          keepAlive: true,
          reconnectDelay: 100,
          connectTimeout: 1000
        },
        database: 1 // Use separate database for message queue
      });
      
      await this.client.connect();
      if (!IS_PRODUCTION) {
        console.log('✅ Ultra message queue connected to Redis');
      }
      
      // Start processing messages
      this.startProcessing();
      
    } catch (error) {
      console.error('❌ Message queue Redis connection failed:', error);
    }
  }
  
  async startProcessing() {
    if (this.isProcessing || !this.client) return;
    this.isProcessing = true;
    
    if (!IS_PRODUCTION) {
      console.log('🚀 Starting ultra-fast message queue processing...');
    }
    
    while (this.isProcessing) {
      try {
        // Process messages in batches for maximum performance
        const messages = await this.client.xRead(
          { key: 'messages:queue', id: '0' },
          { COUNT: this.batchSize, BLOCK: this.processingInterval }
        );
        
        if (messages && messages.length > 0) {
          await this.processBatch(messages);
        }
        
        // Yield control briefly for other operations
        await new Promise(resolve => setImmediate(resolve));
        
      } catch (error) {
        console.error('❌ Message queue processing error:', error);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  async processBatch(messages) {
    const operations = [];
    
    for (const message of messages) {
      const data = message.message;
      
      // Prepare database operation for bulk insert
      operations.push({
        insertOne: {
          document: {
            _id: data.messageId,
            conversationId: data.conversationId,
            sender: data.sender,
            content: data.content,
            timestamp: new Date(parseInt(data.timestamp)),
            createdAt: new Date(),
            type: data.type || 'text',
            readBy: [],
            deliveredTo: []
          }
        }
      });
    }
    
    // Bulk insert for maximum performance
    if (operations.length > 0) {
      try {
        const { default: MessageModel } = await import('../models/MessageNew.js');
        await MessageModel.bulkWrite(operations, { ordered: false });
        if (!IS_PRODUCTION) {
          console.log(`⚡ Processed ${operations.length} messages in batch`);
        }
      } catch (error) {
        console.error('❌ Batch message processing error:', error);
      }
    }
  }
  
  async addMessage(messageData) {
    if (!this.client) return false;
    
    try {
      await this.client.xAdd('messages:queue', '*', {
        messageId: messageData.messageId,
        conversationId: messageData.conversationId,
        sender: messageData.sender,
        content: messageData.content,
        type: messageData.type || 'text',
        timestamp: Date.now().toString()
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error adding message to queue:', error);
      return false;
    }
  }
  
  stop() {
    this.isProcessing = false;
    if (this.client) {
      this.client.quit();
    }
  }
}

// Create ultra-fast message queue instance
const ultraMessageQueue = new UltraMessageQueue();

// Ultra-fast message ID generation
function generateUltraFastMessageId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

export function getIO() {
  return ioInstance;
}

export default function initSocket(io) {
  ioInstance = io;
  
  if (!IS_PRODUCTION) {
    console.log('🚀 Initializing ultra-performance Socket.IO...');
  }
  
  // Connection statistics
  let connectionStats = {
    total: 0,
    active: 0,
    peak: 0,
    messagesPerSecond: 0,
    messageCount: 0,
    lastMessageTime: Date.now()
  };
  
  // Monitor performance every 10 seconds (only in development)
  if (!IS_PRODUCTION) {
    setInterval(() => {
      const now = Date.now();
      const timeDiff = (now - connectionStats.lastMessageTime) / 1000;
      connectionStats.messagesPerSecond = timeDiff > 0 ? 
        connectionStats.messageCount / timeDiff : 0;
      
      console.log(`📊 Socket.IO Performance:`);
      console.log(`├─ Active Connections: ${connectionStats.active}`);
      console.log(`├─ Peak Connections: ${connectionStats.peak}`);
      console.log(`├─ Messages/Second: ${connectionStats.messagesPerSecond.toFixed(2)}`);
      console.log(`└─ Total Messages: ${connectionStats.messageCount}`);
      
      // Reset counters
      connectionStats.messageCount = 0;
      connectionStats.lastMessageTime = now;
    }, 10000);
  }
  
  // Ultra-fast authentication middleware with improved error handling
  io.use(async (socket, next) => {
    try {
      // Try multiple token sources for maximum compatibility
      let token = socket.handshake.auth?.token || 
                  socket.handshake.query?.token ||
                  socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
                  socket.handshake.headers?.authorization;
      
      // Clean up token if it has Bearer prefix
      if (token && token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '');
      }
      
      if (!token) {
        console.error('❌ Socket auth failed: No token provided', {
          hasAuth: !!socket.handshake.auth,
          hasQuery: !!socket.handshake.query,
          hasAuthHeader: !!socket.handshake.headers?.authorization,
          authKeys: Object.keys(socket.handshake.auth || {}),
          queryKeys: Object.keys(socket.handshake.query || {}),
          headers: Object.keys(socket.handshake.headers || {})
        });
        return next(new Error('Authentication error: No token provided'));
      }
      
      // Ultra-fast JWT verification
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password').lean(); // Use lean for performance
      
      if (!user) {
        console.error('❌ Socket auth failed: User not found', { userId: decoded.id });
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user data to socket
      socket.user = user;
      socket.userId = user._id.toString();
      socket.userEmail = user.email;
      socket.userName = user.name;
      
      // Join user to their personal room for direct messaging
      socket.join(`user:${socket.userId}`);
      
      if (!IS_PRODUCTION) {
        console.log('✅ Socket authenticated successfully:', {
          userId: socket.userId,
          userName: socket.userName,
          socketId: socket.id
        });
      }
      
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', {
        message: error.message,
        name: error.name,
        hasToken: !!socket.handshake.auth?.token,
        hasQuery: !!socket.handshake.query?.token,
        hasAuthHeader: !!socket.handshake.headers?.authorization,
        socketId: socket.id
      });
      
      // Provide more specific error messages
      if (error.name === 'JsonWebTokenError') {
        return next(new Error('Authentication error: Invalid token format'));
      } else if (error.name === 'TokenExpiredError') {
        return next(new Error('Authentication error: Token expired'));
      } else {
        return next(new Error('Authentication error: Invalid token'));
      }
    }
  });

  // Ultra-performance connection handler
  io.on('connection', (socket) => {
    connectionStats.total++;
    connectionStats.active++;
    connectionStats.peak = Math.max(connectionStats.peak, connectionStats.active);
    
    const userId = socket.userId;
    const user = socket.user;
    
    if (!IS_PRODUCTION) {
      console.log(`🔌 Ultra-fast connection: ${user.name} (${userId}) - Socket: ${socket.id}`);
    }
    
    // Limit listeners per socket for performance
    socket.setMaxListeners(25);
    
    // Initialize ultra-performance message handlers
    initMessageSocket(io, socket, ultraMessageQueue);
    
    // Ultra-fast ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { 
        timestamp: Date.now(),
        latency: Date.now() - (socket.lastPing || Date.now())
      });
    });

    // Enhanced test message handler with performance metrics
    socket.on('test:message', (data) => {
      const startTime = Date.now();
      
      socket.emit('test:response', { 
        message: 'Ultra-fast test response',
        originalData: data,
        timestamp: Date.now(),
        userId: userId,
        userName: user.name,
        socketId: socket.id,
        responseTime: Date.now() - startTime,
        performance: 'maximum'
      });
    });
    
    // Ultra-fast user presence with intelligent broadcasting
    socket.on('user:presence', ({ status }) => {
      // Broadcast presence update efficiently
      socket.broadcast.emit('user:presence_update', {
        userId,
        status,
        timestamp: Date.now()
      });
      
      // Update user status in database asynchronously
      setImmediate(async () => {
        try {
          await User.findByIdAndUpdate(userId, { 
            lastSeen: new Date(),
            status: status || 'online'
          });
        } catch (error) {
          console.error('❌ User presence update error:', error);
        }
      });
    });
    
    // Ultra-fast conversation joining
    socket.on('conversation:join', (data) => {
      if (!data.conversationId) return;
      
      socket.join(data.conversationId);
      socket.emit('conversation:joined', {
        conversationId: data.conversationId,
        timestamp: Date.now(),
        userId: userId
      });
      
      if (!IS_PRODUCTION) {
        console.log(`👥 User ${userId} joined conversation ${data.conversationId}`);
      }
    });
    
    // Ultra-fast conversation leaving
    socket.on('conversation:leave', (data) => {
      if (!data.conversationId) return;
      
      socket.leave(data.conversationId);
      socket.emit('conversation:left', {
        conversationId: data.conversationId,
        timestamp: Date.now(),
        userId: userId
      });
    });
    
    // Ultra-fast notification handling
    socket.on('notification:read', async (data) => {
      if (!data.notificationId) return;
      
      try {
        // Update notification asynchronously
        setImmediate(async () => {
          const { default: NotificationModel } = await import('../models/Notification.js');
          await NotificationModel.findByIdAndUpdate(data.notificationId, {
            read: true,
            readAt: new Date()
          });
        });
        
        socket.emit('notification:read_confirmed', {
          notificationId: data.notificationId,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('❌ Notification read error:', error);
      }
    });
    
    // Handle errors with detailed logging
    socket.on('error', (error) => {
      if (!IS_PRODUCTION) {
        console.error(`❌ Socket error for user ${userId}:`, error);
      }
      
      // Send error details to client for debugging
      socket.emit('socket:error', {
        error: error.message,
        timestamp: Date.now(),
        socketId: socket.id
      });
    });
    
    // Ultra-fast disconnect handling
    socket.on('disconnect', (reason) => {
      connectionStats.active--;
      
      if (!IS_PRODUCTION) {
        console.log(`🔌 Ultra-fast disconnect: ${user.name} (${userId}) - Reason: ${reason}`);
      }
      
      // Broadcast offline status efficiently
      socket.broadcast.emit('user:presence_update', {
        userId,
        status: 'offline',
        timestamp: Date.now(),
        reason
      });
      
      // Update last seen asynchronously
      setImmediate(async () => {
        try {
          await User.findByIdAndUpdate(userId, { 
            lastSeen: new Date(),
            status: 'offline'
          });
        } catch (error) {
          console.error('❌ User last seen update error:', error);
        }
      });
      
      // Clean up socket listeners for memory efficiency
      socket.removeAllListeners();
    });
    
    // Send ultra-fast connection confirmation with performance info
    socket.emit('connected', {
      userId,
      socketId: socket.id,
      timestamp: Date.now(),
      message: 'Ultra-performance connection established',
      serverInfo: {
        version: '2.0.0-ultra',
        performance: 'maximum',
        features: [
          'clustering', 
          'message-queue', 
          'optimistic-updates',
          'ultra-fast-processing',
          'intelligent-caching'
        ]
      },
      connectionStats: {
        active: connectionStats.active,
        peak: connectionStats.peak
      }
    });
  });
  
  // Handle server-level errors with enhanced logging
  io.engine.on('connection_error', (err) => {
    console.error('❌ Socket.IO connection error:', err);
  });
  
  // Global error handling
  io.on('error', (error) => {
    console.error('❌ Socket.IO global error:', error);
  });
  
  if (!IS_PRODUCTION) {
    console.log('✅ Ultra-performance Socket.IO initialization complete');
  }
  
  // Cleanup on process exit
  process.on('SIGTERM', () => {
    if (!IS_PRODUCTION) {
      console.log('🔄 Gracefully closing ultra-performance Socket.IO...');
    }
    ultraMessageQueue.stop();
    io.close(() => {
      if (!IS_PRODUCTION) {
        console.log('✅ Ultra-performance Socket.IO closed');
      }
    });
  });
  
  return io;
}