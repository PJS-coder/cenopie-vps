import { Router } from 'express';
import {
  getShowcases,
  getTopShowcases,
  getPosters,
  getSponsoredBanners,
  trackBannerClick,
  getShowcase,
  createShowcase,
  updateShowcase,
  deleteShowcase,
  toggleLike,
  getUserShowcases
} from '../controllers/showcaseController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes
router.get('/', getShowcases);
router.get('/top', getTopShowcases);
router.get('/posters', getPosters);
router.get('/banners', getSponsoredBanners);
router.get('/user/:userId', getUserShowcases);
router.get('/:id', getShowcase);

// Protected routes
router.use(protect);

router.post('/', createShowcase);
router.put('/:id', updateShowcase);
router.delete('/:id', deleteShowcase);
router.post('/:id/like', toggleLike);
router.post('/banners/:bannerId/click', trackBannerClick);

export default router;