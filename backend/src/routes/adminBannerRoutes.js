import express from 'express';
import {
  getAllBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  getBannerAnalytics
} from '../controllers/adminBannerController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(admin);

// Banner management routes
router.get('/', getAllBanners);
router.get('/:id', getBanner);
router.post('/', createBanner);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);
router.patch('/:id/toggle', toggleBannerStatus);
router.get('/:id/analytics', getBannerAnalytics);

export default router;