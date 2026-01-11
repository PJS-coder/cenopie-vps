import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getNotifications, markRead } from '../controllers/notificationController.js';

const router = Router();
router.get('/', protect, getNotifications);
router.post('/read', protect, markRead);
export default router;
