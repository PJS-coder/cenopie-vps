import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getChats,
  getChatMessages,
  sendMessage,
  markAsRead,
  createOrGetChat,
  testSocket,
  testSaveMessage
} from '../controllers/chatController.js';

const router = express.Router();

// Test Socket.IO connection (no auth required for testing)
router.get('/test-socket', (req, res) => {
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
});

// Test message saving (no auth required for testing)
router.get('/test-save', testSaveMessage);

// All routes below require authentication
router.use(protect);

// Get all chats for user
router.get('/', getChats);

// Create or get existing chat
router.post('/', createOrGetChat);

// Get messages for a specific chat
router.get('/:chatId/messages', getChatMessages);

// Send a message
router.post('/:chatId/messages', sendMessage);

// Mark messages as read
router.post('/:chatId/read', markAsRead);

export default router;