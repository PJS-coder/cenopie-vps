import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { initMessageSocket } from './messageSocket.js';

let ioInstance = null;

export function getIO() {
  return ioInstance;
}

export default function initSocket(io) {
  ioInstance = io;
  
  // Enhanced middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                   socket.handshake.query?.token ||
                   socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user data to socket
      socket.user = user;
      socket.userId = user._id.toString();
      
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    const userId = socket.userId;
    const user = socket.user;
    
    console.log(`User ${user.name} (${userId}) connected via socket`);
    
    // Join user's personal room for direct messaging
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    
    // Initialize message-specific socket handlers
    initMessageSocket(io, socket);
    
    // Handle general events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Test message handler for debugging
    socket.on('test:message', (data) => {
      socket.emit('test:response', { 
        message: 'Test message received successfully',
        originalData: data,
        timestamp: new Date().toISOString(),
        userId: userId,
        userName: user.name
      });
    });
    
    // Handle user presence
    socket.on('user:presence', ({ status }) => {
      // Broadcast presence update to user's contacts
      socket.broadcast.emit('user:presence_update', {
        userId,
        status,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
    
    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User ${user.name} (${userId}) disconnected: ${reason}`);
      
      // Broadcast offline status
      socket.broadcast.emit('user:presence_update', {
        userId,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    });
    
    // Send connection confirmation
    socket.emit('connected', {
      userId,
      timestamp: new Date().toISOString(),
      message: 'Successfully connected to messaging service'
    });
  });
  
  // Handle server-level errors
  io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', err);
  });
}