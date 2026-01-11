import express from 'express';
import {
  getQuestionsByDomain,
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkCreateQuestions,
  reorderQuestions
} from '../controllers/adminInterviewController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// Get all questions
router.get('/questions', getAllQuestions);

// Get questions by domain
router.get('/questions/domain/:domain', getQuestionsByDomain);

// Create new question
router.post('/questions', createQuestion);

// Bulk create questions
router.post('/questions/bulk', bulkCreateQuestions);

// Update question
router.put('/questions/:questionId', updateQuestion);

// Delete question
router.delete('/questions/:questionId', deleteQuestion);

// Reorder questions
router.post('/questions/reorder', reorderQuestions);

export default router;
