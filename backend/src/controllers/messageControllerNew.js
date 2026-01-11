import MessageNew, { MESSAGE_STATUS, MESSAGE_TYPE } from '../models/MessageNew.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Define conversation types locally
const CONVERSATION_TYPE = {
  DIRECT: 'direct',
  GROUP: 'group'
};
import rateLimit from 'express-rate-limit';
import { getIO } from '../socket/index.js';

// Rate limiting for message sending
export const messageSendLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    message: 'Too many messages sent. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = MESSAGE_TYPE.TEXT, replyTo, attachments, clientId } = req.body;
    const senderId = req.user._id;

    // Validation
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message content or attachments are required'
      });
    }

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user can send messages to this conversation
    if (!conversation.canUserSendMessage(senderId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages to this conversation'
      });
    }

    // Check for duplicate message using clientId
    if (clientId) {
      const existingMessage = await MessageNew.findOne({
        'metadata.clientId': clientId,
        sender: senderId
      });

      if (existingMessage) {
        return res.status(200).json({
          success: true,
          data: existingMessage,
          message: 'Message already exists'
        });
      }
    }

    // Validate reply-to message if provided
    if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
      const replyMessage = await MessageNew.findById(replyTo);
      if (!replyMessage || replyMessage.conversationId.toString() !== conversationId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reply-to message'
        });
      }
    }

    // Create message
    const messageData = {
      conversationId,
      sender: senderId,
      type,
      content: content?.trim(),
      attachments: attachments || [],
      replyTo: replyTo || undefined,
      status: MESSAGE_STATUS.SENT,
      metadata: {
        clientId,
        platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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

    // Mark as delivered to all participants except sender
    const otherParticipants = conversation.activeParticipants
      .filter(p => p.user.toString() !== senderId.toString())
      .map(p => p.user);

    for (const participantId of otherParticipants) {
      await message.markAsDelivered(participantId);
    }

    // Emit real-time events
    const io = getIO();
    if (io) {
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
        reactions: message.reactions
      };

      // Send to all conversation participants
      conversation.activeParticipants.forEach(participant => {
        const userId = participant.user.toString();
        io.to(`user:${userId}`).emit('message:new', messagePayload);
      });
    }

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const userId = req.user._id;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    // Check if user is participant in conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isParticipant = conversation.participants.some(
      p => p.user.toString() === userId.toString() && p.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this conversation'
      });
    }

    // Build query
    const query = {
      conversationId,
      $or: [
        { deleted: false },
        { deleted: true, deletedFor: { $ne: userId } }
      ]
    };

    // Add pagination with cursor (before timestamp)
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages
    const messages = await MessageNew.find(query)
      .populate('sender', 'name profileImage isVerified')
      .populate({
        path: 'replyTo',
        select: 'content sender type attachments',
        populate: { path: 'sender', select: 'name profileImage' }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Mark messages as read
    const unreadMessages = messages.filter(msg => 
      msg.sender._id.toString() !== userId.toString() && 
      !msg.isReadBy(userId)
    );

    for (const message of unreadMessages) {
      await message.markAsRead(userId);
    }

    // Update conversation last read timestamp
    await conversation.updateLastRead(userId);

    // Get total count for pagination
    const totalMessages = await MessageNew.countDocuments(query);
    const hasMore = skip + messages.length < totalMessages;

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          hasMore,
          nextCursor: messages.length > 0 ? messages[0].createdAt : null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get conversations for user
export const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeArchived = false } = req.query;
    const userId = req.user._id;

    // Build query
    const query = {
      'participants.user': userId,
      'participants.isActive': true
    };

    if (includeArchived !== 'true') {
      query['participants.isArchived'] = { $ne: true };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get conversations with populated data
    const conversations = await Conversation.find(query)
      .populate('participants.user', 'name profileImage isVerified')
      .populate('lastMessage')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add unread counts and format response
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        // Calculate actual unread count by counting messages not read by this user
        let unreadCount = 0;
        if (conversation.lastMessage) {
          const MessageNew = mongoose.model('MessageNew');
          unreadCount = await MessageNew.countDocuments({
            conversationId: conversation._id,
            sender: { $ne: userId }, // Not sent by this user
            'readBy.user': { $ne: userId } // Not read by this user
          });
        }
        
        // Get other participant for direct conversations
        let otherParticipant = null;
        if (conversation.type === CONVERSATION_TYPE.DIRECT) {
          const otherParticipantData = conversation.participants.find(
            p => p.user._id.toString() !== userId.toString()
          );
          otherParticipant = otherParticipantData?.user;
        }

        return {
          _id: conversation._id,
          type: conversation.type,
          name: conversation.name || otherParticipant?.name || 'Unknown User',
          avatar: conversation.avatar || otherParticipant?.profileImage,
          isVerified: otherParticipant?.isVerified || false,
          lastMessage: conversation.lastMessage,
          lastActivity: conversation.lastActivity,
          unreadCount,
          participantCount: conversation.participants.length,
          otherParticipant
        };
      })
    );

    res.status(200).json({
      success: true,
      data: conversationsWithUnread,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: conversations.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
};

// Create or get direct conversation
export const createOrGetDirectConversation = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user._id;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (currentUserId.toString() === otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId).select('name profileImage isVerified');
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreateDirect(currentUserId, otherUserId);

    // Format the conversation response to match frontend expectations
    const formattedConversation = {
      _id: conversation._id,
      type: conversation.type,
      name: otherUser.name,
      avatar: otherUser.profileImage,
      isVerified: otherUser.isVerified,
      lastMessage: conversation.lastMessage,
      lastActivity: conversation.lastActivity || new Date(),
      unreadCount: 0, // New conversation has no unread messages
      participantCount: conversation.participants.length,
      participants: conversation.participants,
      otherParticipant: otherUser
    };

    res.json({
      success: true,
      data: {
        conversation: formattedConversation,
        otherUser
      }
    });

  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create or get conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search messages
export const searchMessages = async (req, res) => {
  try {
    const { q: searchTerm, conversationId, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long'
      });
    }

    let query = {};

    // If conversationId is provided, search within that conversation
    if (conversationId) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid conversation ID'
        });
      }

      // Verify user is participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      const isParticipant = conversation.participants.some(
        p => p.user.toString() === userId.toString() && p.isActive
      );

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to search this conversation'
        });
      }

      query.conversationId = conversationId;
    } else {
      // Search across all user's conversations
      const userConversations = await Conversation.find({
        'participants.user': userId,
        'participants.isActive': true
      }).select('_id');

      query.conversationId = { $in: userConversations.map(c => c._id) };
    }

    const messages = await MessageNew.searchMessages(
      conversationId,
      searchTerm,
      userId,
      {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      }
    );

    res.json({
      success: true,
      data: {
        messages,
        searchTerm,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    const message = await MessageNew.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findById(message.conversationId);
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === userId.toString() && p.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark this message as read'
      });
    }

    await message.markAsRead(userId);

    // Emit read receipt
    const io = getIO();
    if (io) {
      io.to(`user:${message.sender.toString()}`).emit('message:read', {
        messageId: message._id,
        readBy: userId,
        readAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add reaction to message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid emoji is required'
      });
    }

    const message = await MessageNew.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findById(message.conversationId);
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === userId.toString() && p.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to react to this message'
      });
    }

    await message.addReaction(userId, emoji);

    // Emit reaction event
    const io = getIO();
    if (io) {
      conversation.activeParticipants.forEach(participant => {
        const participantId = participant.user.toString();
        io.to(`user:${participantId}`).emit('message:reaction', {
          messageId: message._id,
          userId,
          emoji,
          action: 'add'
        });
      });
    }

    res.json({
      success: true,
      message: 'Reaction added successfully'
    });

  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove reaction from message
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    const message = await MessageNew.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findById(message.conversationId);
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === userId.toString() && p.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to remove reaction from this message'
      });
    }

    await message.removeReaction(userId);

    // Emit reaction event
    const io = getIO();
    if (io) {
      conversation.activeParticipants.forEach(participant => {
        const participantId = participant.user.toString();
        io.to(`user:${participantId}`).emit('message:reaction', {
          messageId: message._id,
          userId,
          action: 'remove'
        });
      });
    }

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    const message = await MessageNew.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender or has permission to delete
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Check time limit for delete for everyone (e.g., 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (deleteForEveryone && message.createdAt < oneHourAgo) {
      return res.status(400).json({
        success: false,
        message: 'Messages can only be deleted for everyone within 1 hour of sending'
      });
    }

    if (deleteForEveryone) {
      await message.softDelete(); // Delete for everyone
    } else {
      await message.softDelete(userId); // Delete for user only
    }

    // Emit delete event
    const io = getIO();
    if (io) {
      const conversation = await Conversation.findById(message.conversationId);
      conversation.activeParticipants.forEach(participant => {
        const participantId = participant.user.toString();
        io.to(`user:${participantId}`).emit('message:deleted', {
          messageId: message._id,
          deletedBy: userId,
          deleteForEveryone
        });
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Archive/unarchive conversation
export const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { archived = true } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === userId.toString() && p.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to archive this conversation'
      });
    }

    await conversation.setArchiveStatus(archived, userId);

    res.json({
      success: true,
      message: `Conversation ${archived ? 'archived' : 'unarchived'} successfully`
    });

  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};