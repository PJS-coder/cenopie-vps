import Chat from '../models/Chat.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Get all chats for a user
export const getChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'name profileImage')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    // Format chats with unread counts
    const formattedChats = chats.map(chat => {
      const unreadCount = chat.unreadCounts.get(userId.toString()) || 0;
      
      console.log('📋 Formatting chat:', chat._id);
      console.log('Participants:', chat.participants.map(p => ({ id: p._id, name: p.name })));
      console.log('Current user ID:', userId);
      
      return {
        id: chat._id,
        participants: chat.participants.map(p => ({
          id: p._id.toString(),
          name: p.name,
          profileImage: p.profileImage
        })),
        lastMessage: chat.lastMessage,
        unreadCount
      };
    });

    res.json({ chats: formattedChats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

// Get messages for a specific chat
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    }).populate('participants', 'name profileImage');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Get ALL messages (removed limit)
    const messages = await ChatMessage.find({ chatId })
      .sort({ createdAt: 1 });

    // Transform messages to ensure proper ID serialization
    const transformedMessages = messages.map(message => ({
      id: message._id.toString(),
      content: message.content,
      senderId: message.senderId.toString(),
      createdAt: message.createdAt,
      type: message.type,
      readBy: message.readBy?.map(read => ({
        userId: read.userId.toString(),
        readAt: read.readAt
      })) || []
    }));

    // Get other participant info
    const otherUser = chat.participants.find(p => p._id.toString() !== userId);

    res.json({ 
      messages: transformedMessages,
      otherUser
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Test message saving (temporary debug endpoint)
export const testSaveMessage = async (req, res) => {
  try {
    const testMessage = new ChatMessage({
      chatId: '697ceb225fdf19fa9ade2432',
      senderId: '69566d0712f2a47872633c76',
      content: 'Test message from debug endpoint - ' + new Date().toISOString(),
      type: 'text'
    });

    const savedMessage = await testMessage.save();
    const messages = await ChatMessage.find({ chatId: '697ceb225fdf19fa9ade2432' }).limit(5);

    res.json({ 
      success: true, 
      message: savedMessage,
      totalMessages: messages.length,
      dbState: mongoose.connection.readyState,
      dbName: mongoose.connection.name
    });
  } catch (error) {
    console.error('Test message save failed:', error);
    res.status(500).json({ error: error.message });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text' } = req.body;
    const userId = req.user.id;

    // Verify user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Create message
    const message = new ChatMessage({
      chatId,
      senderId: userId,
      content,
      type,
      readBy: [{ userId }] // Mark as read by sender
    });

    await message.save();

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();

    // Update unread counts for other participants
    chat.participants.forEach(participantId => {
      const participantIdStr = participantId.toString();
      if (participantIdStr !== userId) {
        const currentCount = chat.unreadCounts.get(participantIdStr) || 0;
        chat.unreadCounts.set(participantIdStr, currentCount + 1);
      }
    });

    await chat.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${chatId}`).emit('new_message', {
        id: message._id.toString(),
        chatId,
        content,
        type,
        senderId: userId,
        createdAt: message.createdAt
      });
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Mark unread messages as read
    await ChatMessage.updateMany(
      {
        chatId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );

    // Reset unread count for this user
    chat.unreadCounts.set(userId, 0);
    await chat.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// Test Socket.IO connection
export const testSocket = async (req, res) => {
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('test_message', { message: 'Socket.IO is working!', timestamp: new Date() });
      res.json({ success: true, message: 'Test message sent via Socket.IO' });
    } else {
      res.status(500).json({ error: 'Socket.IO instance not found' });
    }
  } catch (error) {
    console.error('Error testing socket:', error);
    res.status(500).json({ error: 'Failed to test socket' });
  }
};

// Create or get existing chat between two users
export const createOrGetChat = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user.id;

    console.log('🔄 Creating/getting chat between:', userId, 'and', otherUserId);

    if (userId === otherUserId) {
      return res.status(400).json({ error: 'Cannot create chat with yourself' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [userId, otherUserId] }
    });

    if (!chat) {
      console.log('📝 Creating new chat');
      // Create new chat
      chat = new Chat({
        participants: [userId, otherUserId],
        unreadCounts: new Map([
          [userId, 0],
          [otherUserId, 0]
        ])
      });
      await chat.save();
    } else {
      console.log('✅ Found existing chat:', chat._id);
    }

    await chat.populate('participants', 'name profileImage');
    
    console.log('👥 Chat participants after populate:', chat.participants.map(p => ({ id: p._id, name: p.name })));

    res.json({ chat });
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
};