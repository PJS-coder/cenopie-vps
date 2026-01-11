import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { 
  createPost, 
  getPostById, 
  likePost, 
  commentPost, 
  deletePost, 
  feed,
  repostPost,
  deleteComment,
  getUserPosts
} from '../controllers/postController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Add specific rate limiting for feed endpoint (30 requests per minute)
const feedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    message: 'Too many feed requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiter specifically to the feed endpoint
router.route('/feed').get(protect, feedLimiter, feed);

router.route('/').post(protect, createPost);
router.route('/user/:userId').get(protect, getUserPosts);
router.route('/:postId').get(protect, getPostById).delete(protect, deletePost);
router.route('/:postId/like').post(protect, likePost);
router.route('/:postId/comment').post(protect, commentPost);
router.route('/:postId/repost').post(protect, repostPost);
router.route('/:postId/comments/:commentId').delete(protect, deleteComment);

export default router;