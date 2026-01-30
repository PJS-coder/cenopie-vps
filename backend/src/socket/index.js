import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { initChatSocket } from './chatSocket.js';
import logger from '../config/logger.js';

let ioInstance = null;

export function getIO() {
  return ioInstance;
}

export default function initSocket(io) {
  ioInstance = io;
  
  console.log('🚀 Initializing Socket.IO for chat...');
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || 
                  socket.handshake.query?.token ||
                  socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      console.log('Socket auth attempt - token source:', {
        auth: !!socket.handshake.auth?.token,
        query: !!socket.handshake.query?.token,
        headers: !!socket.handshake.headers?.authorization
      });
      
      if (token && token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '');
      }
      
      if (!token) {
        console.log('❌ No token provided for socket auth');
        return next(new Error('Authentication error: No token provided'));
      }
      
      console.log('🔍 Verifying token:', token.substring(0, 20) + '...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decoded:', { id: decoded.id });
      
      const user = await User.findById(decoded.id).select('-password').lean();
      
      if (!user) {
        console.log('❌ User not found for ID:', decoded.id);
        return next(new Error('Authentication error: User not found'));
      }
      
      console.log('✅ User found:', { 
        id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName,
        name: user.name 
      });
      
      socket.user = user;
      socket.userId = user._id.toString();
      
      // Join user to their personal room
      socket.join(`user:${socket.userId}`);
      
      console.log('✅ Socket authenticated:', user.firstName || user.name, user.lastName || '');
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userName = socket.user.firstName || socket.user.name || 'Unknown';
    const userLastName = socket.user.lastName || '';
    console.log(`🔌 User connected: ${userName} ${userLastName}`);
    
    // Initialize chat functionality
    initChatSocket(io, socket);
    
    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${userName} ${userLastName} - ${reason}`);
    });
    
    // Send connection confirmation
    socket.emit('connected', {
      userId: socket.userId,
      message: 'Connected to chat server'
    });
  });
  
  console.log('✅ Socket.IO initialization complete');
  return io;
}