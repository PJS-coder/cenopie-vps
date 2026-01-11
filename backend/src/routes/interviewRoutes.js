import express from 'express';
import {
  createInterview,
  getMyInterviews,
  getInterview,
  startInterview,
  submitAnswer,
  completeInterview,
  deleteInterview
} from '../controllers/interviewController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Interview routes
router.post('/', createInterview);
router.get('/', getMyInterviews);
router.get('/:id', getInterview);
router.post('/:id/start', startInterview);
router.post('/:id/answer', submitAnswer);
router.post('/:id/complete', completeInterview);
router.delete('/:id', deleteInterview);

export default router;
