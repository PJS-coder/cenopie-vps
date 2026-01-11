import express from 'express';
import {
  getCompanyInterviews,
  getInterviewStats,
  getInterviewDetails,
  reviewInterview
} from '../controllers/companyInterviewController.js';
import { companyAuthApproved } from './companyAuthRoutes.js';

const router = express.Router();

// All routes require company authentication
router.use(companyAuthApproved);

// Company interview routes
router.get('/', getCompanyInterviews);
router.get('/stats', getInterviewStats);
router.get('/:id', getInterviewDetails);
router.post('/:id/review', reviewInterview);

export default router;
