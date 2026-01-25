import express from 'express';
import {
  getShowcaseBanners,
  getAllShowcaseBanners,
  uploadShowcaseBanner,
  createShowcaseBanner,
  updateShowcaseBanner,
  deleteShowcaseBanner,
  toggleShowcaseBannerStatus,
  upload
} from '../controllers/showcaseBannerController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public route - get active banners for showcase page
router.get('/', getShowcaseBanners);

// Admin routes
router.use(protect);
router.use(admin);

router.get('/admin', getAllShowcaseBanners);
router.post('/admin/upload', upload.single('image'), uploadShowcaseBanner);
router.post('/admin', createShowcaseBanner); // Legacy support
router.put('/admin/:id', updateShowcaseBanner);
router.delete('/admin/:id', deleteShowcaseBanner);
router.patch('/admin/:id/toggle', toggleShowcaseBannerStatus);

export default router;