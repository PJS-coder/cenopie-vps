import express from 'express';
import {
  getActiveBanners,
  trackBannerClick,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
} from '../controllers/bannerController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getActiveBanners);
router.post('/:id/click', trackBannerClick);

// Admin routes (protected)
router.get('/admin', protect, admin, getAllBanners);
router.post('/admin', protect, admin, createBanner);
router.put('/admin/:id', protect, admin, updateBanner);
router.delete('/admin/:id', protect, admin, deleteBanner);
router.patch('/admin/:id/toggle', protect, admin, toggleBannerStatus);

export default router;