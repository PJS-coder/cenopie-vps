import express from 'express';
import {
  getAllShowcaseBanners,
  getShowcaseBanner,
  createShowcaseBanner,
  updateShowcaseBanner,
  deleteShowcaseBanner,
  toggleShowcaseBannerStatus,
  getShowcaseBannerAnalytics
} from '../controllers/adminShowcaseBannerController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(admin);

// Showcase banner management routes
router.get('/', getAllShowcaseBanners);
router.get('/:id', getShowcaseBanner);
router.post('/', createShowcaseBanner);
router.put('/:id', updateShowcaseBanner);
router.delete('/:id', deleteShowcaseBanner);
router.patch('/:id/toggle', toggleShowcaseBannerStatus);
router.get('/:id/analytics', getShowcaseBannerAnalytics);

export default router;