import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  sendMessage,
  getMessages,
  getConversations,
  createOrGetDirectConversation,
  searchMessages,
  markMessageAsRead,
  addReaction,
  removeReaction,
  deleteMessage,
  archiveConversation
} from '../controllers/messageControllerNew.js';

const router = Router();

// New conversation routes (put specific routes first)
router.get('/conversations', protect, getConversations);
router.get('/conversations/:userId/direct', protect, createOrGetDirectConversation);
router.get('/conversations/:conversationId/messages', protect, getMessages);
router.patch('/conversations/:conversationId/archive', protect, archiveConversation);

// New message routes
router.post('/send', protect, sendMessage);
router.get('/search', protect, searchMessages);
router.patch('/messages/:messageId/read', protect, markMessageAsRead);
router.post('/messages/:messageId/reactions', protect, addReaction);
router.delete('/messages/:messageId/reactions', protect, removeReaction);
router.delete('/messages/:messageId', protect, deleteMessage);

export default router;