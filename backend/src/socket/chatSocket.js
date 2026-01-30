import Chat from '../models/Chat.js';
import ChatMessage from '../models/ChatMessage.js';

export function initChatSocket(io, socket) {
  // Join chat rooms for user's chats
  socket.on('chat:join', async (chatId) => {
    try {
      console.log(`User ${socket.userId} attempting to join chat ${chatId}`);
      
      // Verify user is participant in this chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: socket.userId
      });

      if (chat) {
        socket.join(`chat_${chatId}`);
        socket.emit('chat:joined', { chatId });
        console.log(`✅ User ${socket.userId} joined chat ${chatId}`);
      } else {
        console.log(`❌ User ${socket.userId} not authorized for chat ${chatId}`);
      }
    } catch (error) {
      console.error('Error joining chat:', error);
    }
  });

  // Leave chat room
  socket.on('chat:leave', (chatId) => {
    socket.leave(`chat_${chatId}`);
    socket.emit('chat:left', { chatId });
  });

  // Handle typing indicators
  socket.on('chat:typing', ({ chatId, isTyping }) => {
    socket.to(`chat_${chatId}`).emit('chat:typing', {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping
    });
  });

  // Auto-join user's existing chats on connection
  setTimeout(async () => {
    try {
      const userChats = await Chat.find({
        participants: socket.userId
      }).select('_id');

      userChats.forEach(chat => {
        socket.join(`chat_${chat._id}`);
      });

      console.log(`User ${socket.userId} auto-joined ${userChats.length} chats`);
    } catch (error) {
      console.error('Error auto-joining chats:', error);
    }
  }, 100);
}