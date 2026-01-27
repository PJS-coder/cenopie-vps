import MessageNew, { MESSAGE_STATUS, MESSAGE_TYPE } from '../models/MessageNew.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Track typing users per conversation
const typingUsers = new Map();

// Track online users
const onlineUsers = new Map();

// Rate limiting for socket messages
const messageRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 messages per minute

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = messageRateLimit.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > userLimit.resetTime) {
    // Reset the rate limit window
    userLimit.count = 0;
    userLimit.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }
  
  userLimit.count++;
  messageRateLimit.set(userId, userLimit);
  return true;
}

export function initMessageSocket(io, socket) {
  const userId = socket.userId;
  const user = socket.user;

  // Mark user as online
  onlineUsers.set(userId, {
    socketId: socket.id,
    lastSeen: new Date(),
    status: 'online'
  });

  // Broadcast online status to user's conversations
  broadcastUserStatus(io, userId, 'online');

  // Handle typing events
  socket.on('typing:start', async ({ conversationId }) => {
    try {
      if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
        return;
      }

      // Verify user is participant in conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.canUserSendMessage(userId)) {
        return;
      }

      // Add to typing users
      const conversationKey = conversationId.toString();
      if (!typingUsers.has(conversationKey)) {
        typingUsers.set(conversationKey, new Map());
      }
      
      const conversationTyping = typingUsers.get(conversationKey);
      conversationTyping.set(userId, {
        name: user.name,
        startedAt: new Date()
      });

      // Broadcast to other participants
      conversation.activeParticipants.forEach(participant => {
        const participantId = participant.user.toString();
        if (participantId !== userId) {
          io.to(`user:${participantId}`).emit('typing:start', {
            conversationId,
            userId,
            userName: user.name
          });
        }
      });

      // Auto-stop typing after 3 seconds
      setTimeout(() => {
        handleTypingStop(io, socket, conversationId);
      }, 3000);

    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  });

  socket.on('typing:stop', ({ conversationId }) => {
    handleTypingStop(io, socket, conversationId);
  });

  // Handle message sending
  socket.on('message:send', async (data) => {
    try {
      // Check rate limit
      if (!checkRateLimit(userId)) {
        socket.emit('message:error', { 
          error: 'Rate limit exceeded. Please slow down.',
          clientId: data.clientId 
        });
        return;
      }

      const { conversationId, content, type = MESSAGE_TYPE.TEXT, replyTo, attachments, clientId } = data;

      // Validation
      if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
        console.warn('❌ Invalid conversation ID:', conversationId);
        socket.emit('message:error', { 
          error: 'Invalid conversation ID',
          clientId 
        });
        return;
      }

      if (!content && (!attachments || attachments.length === 0)) {
        console.warn('❌ Message content or attachments are required');
        socket.emit('message:error', { 
          error: 'Message content or attachments are required',
          clientId 
        });
        return;
      }

      // Check conversation and permissions
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('message:error', { 
          error: 'Conversation not found',
          clientId 
        });
        return;
      }

      if (!conversation.canUserSendMessage(userId)) {
        socket.emit('message:error', { 
          error: 'You are not authorized to send messages to this conversation',
          clientId 
        });
        return;
      }

      // Check for duplicate message
      if (clientId) {
        const existingMessage = await MessageNew.findOne({
          'metadata.clientId': clientId,
          sender: userId
        });

        if (existingMessage) {
          socket.emit('message:sent', {
            message: existingMessage,
            clientId
          });
          return;
        }
      }

      // Create message
      const messageData = {
        conversationId,
        sender: userId,
        type,
        content: content?.trim(),
        attachments: attachments || [],
        replyTo: replyTo || undefined,
        status: MESSAGE_STATUS.SENT,
        metadata: {
          clientId,
          platform: 'web', // Could be determined from user agent
          ipAddress: socket.handshake.address
        }
      };

      const message = new MessageNew(messageData);
      await message.save();

      // Populate message data
      await message.populate([
        { path: 'sender', select: 'name profileImage isVerified' },
        { path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'name' } }
      ]);

      // Update conversation
      conversation.lastMessage = message._id;
      conversation.messageCount += 1;
      await conversation.save();

      // Mark as delivered to online participants
      const onlineParticipants = conversation.activeParticipants.filter(p => {
        const participantId = p.user.toString();
        return participantId !== userId && onlineUsers.has(participantId);
      });

      for (const participant of onlineParticipants) {
        await message.markAsDelivered(participant.user);
      }

      // Stop typing for sender
      handleTypingStop(io, socket, conversationId);

      // Prepare message payload
      const messagePayload = {
        _id: message._id,
        conversationId: message.conversationId,
        sender: {
          _id: message.sender._id,
          name: message.sender.name,
          profileImage: message.sender.profileImage,
          isVerified: message.sender.isVerified
        },
        type: message.type,
        content: message.content,
        attachments: message.attachments,
        replyTo: message.replyTo,
        status: message.status,
        createdAt: message.createdAt,
        reactions: message.reactions,
        readBy: message.readBy,
        deliveredTo: message.deliveredTo
      };

      // Send confirmation to sender
      socket.emit('message:sent', {
        message: messagePayload,
        clientId
      });

      // Send to other participants
      conversation.activeParticipants.forEach(participant => {
        const participantId = participant.user.toString();
        if (participantId !== userId) {
          io.to(`user:${participantId}`).emit('message:received', messagePayload);
          // Also emit to conversation room
          io.to(`conversation:${conversationId}`).emit('message:received', messagePayload);
        }
      });

    } catch (error) {
      console.error('Error sending message via socket:', error);
      socket.emit('message:error', { 
        error: 'Failed to send message',
        clientId: data.clientId 
      });
    }
  });

  // Handle message read receipts
  socket.on('message:read', async ({ messageId, conversationId }) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return;
      }

      const message = await MessageNew.findById(messageId);
      if (!message) {
        return;
      }

      // Verify user is participant
      const conversation = await Conversation.findById(message.conversationId);
      const isParticipant = conversation.participants.some(
        p => p.user.toString() === userId && p.isActive
      );

      if (!isParticipant) {
        return;
      }

      // Mark as read
      await message.markAsRead(userId);

      // Update conversation last read
      await conversation.updateLastRead(userId);

      // Send read receipt to sender
      io.to(`user:${message.sender.toString()}`).emit('message:read_receipt', {
        messageId: message._id,
        conversationId: message.conversationId,
        readBy: {
          _id: userId,
          name: user.name,
          profileImage: user.profileImage
        },
        readAt: new Date()
      });

    } catch (error) {
      console.error('Error handling message read:', error);
    }
  });

  // Handle conversation read (mark all messages as read)
  socket.on('conversation:read', async ({ conversationId }) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return;
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return;
      }

      // Verify user is participant
      const isParticipant = conversation.participants.some(
        p => p.user.toString() === userId && p.isActive
      );

      if (!isParticipant) {
        return;
      }

      // Mark all unread messages as read
      const unreadMessages = await MessageNew.find({
        conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId },
        deleted: false,
        deletedFor: { $ne: userId }
      });

      for (const message of unreadMessages) {
        await message.markAsRead(userId);
      }

      // Update conversation last read
      await conversation.updateLastRead(userId);

      // Send read receipts for all messages
      const senders = [...new Set(unreadMessages.map(m => m.sender.toString()))];
      senders.forEach(senderId => {
        io.to(`user:${senderId}`).emit('conversation:read_receipt', {
          conversationId,
          readBy: {
            _id: userId,
            name: user.name,
            profileImage: user.profileImage
          },
          readAt: new Date(),
          messageIds: unreadMessages.filter(m => m.sender.toString() === senderId).map(m => m._id)
        });
      });

    } catch (error) {
      console.error('Error handling conversation read:', error);
    }
  });

  // Handle user status updates
  socket.on('user:status', ({ status }) => {
    if (['online', 'away', 'busy', 'offline'].includes(status)) {
      const userStatus = onlineUsers.get(userId);
      if (userStatus) {
        userStatus.status = status;
        userStatus.lastSeen = new Date();
        broadcastUserStatus(io, userId, status);
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove from online users
    onlineUsers.delete(userId);

    // Remove from all typing conversations
    typingUsers.forEach((conversationTyping, conversationId) => {
      if (conversationTyping.has(userId)) {
        conversationTyping.delete(userId);
        
        // Broadcast typing stop
        Conversation.findById(conversationId).then(conversation => {
          if (conversation) {
            conversation.activeParticipants.forEach(participant => {
              const participantId = participant.user.toString();
              if (participantId !== userId) {
                io.to(`user:${participantId}`).emit('typing:stop', {
                  conversationId,
                  userId
                });
              }
            });
          }
        });
      }
    });

    // Broadcast offline status
    broadcastUserStatus(io, userId, 'offline');
  });
}

// Helper function to handle typing stop
function handleTypingStop(io, socket, conversationId) {
  const userId = socket.userId;
  
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    return;
  }

  const conversationKey = conversationId.toString();
  const conversationTyping = typingUsers.get(conversationKey);
  
  if (conversationTyping && conversationTyping.has(userId)) {
    conversationTyping.delete(userId);
    
    // Broadcast to other participants
    Conversation.findById(conversationId).then(conversation => {
      if (conversation) {
        conversation.activeParticipants.forEach(participant => {
          const participantId = participant.user.toString();
          if (participantId !== userId) {
            io.to(`user:${participantId}`).emit('typing:stop', {
              conversationId,
              userId
            });
          }
        });
      }
    });
  }
}

// Helper function to broadcast user status
async function broadcastUserStatus(io, userId, status) {
  try {
    // Find all conversations the user is part of
    const conversations = await Conversation.find({
      'participants.user': userId,
      'participants.isActive': true
    });

    // Get all unique participants from these conversations
    const participants = new Set();
    conversations.forEach(conversation => {
      conversation.activeParticipants.forEach(participant => {
        const participantId = participant.user.toString();
        if (participantId !== userId) {
          participants.add(participantId);
        }
      });
    });

    // Broadcast status to all participants
    participants.forEach(participantId => {
      io.to(`user:${participantId}`).emit('user:status_update', {
        userId,
        status,
        lastSeen: new Date()
      });
    });

  } catch (error) {
    console.error('Error broadcasting user status:', error);
  }
}

// Cleanup function to remove stale typing indicators
setInterval(() => {
  const now = new Date();
  const staleThreshold = 5000; // 5 seconds

  typingUsers.forEach((conversationTyping, conversationId) => {
    conversationTyping.forEach((typingData, userId) => {
      if (now - typingData.startedAt > staleThreshold) {
        conversationTyping.delete(userId);
      }
    });

    // Remove empty conversation maps
    if (conversationTyping.size === 0) {
      typingUsers.delete(conversationId);
    }
  });
}, 10000); // Run every 10 seconds

export { onlineUsers, typingUsers };