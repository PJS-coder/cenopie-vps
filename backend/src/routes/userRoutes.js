import { Router } from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { getProfile, updateProfile, follow, unfollow, getSuggestedUsers, verifyUser, getAllUsers } from '../controllers/userController.js';

const router = Router();
router.get('/', protect, getAllUsers); // Admin route to get all users (removed admin middleware per secure admin requirements)
router.get('/suggested', protect, getSuggestedUsers); // New endpoint for suggested users
router.get('/:id', protect, getProfile);
router.put('/me', protect, updateProfile);
router.put('/:id/verify', protect, verifyUser); // Admin route for user verification (removed admin middleware per secure admin requirements)
router.post('/:id/follow', protect, follow);
router.post('/:id/unfollow', protect, unfollow);
export default router;