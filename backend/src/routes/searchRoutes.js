import { Router } from 'express';
import { search } from '../controllers/searchController.js';

const router = Router();

// Search endpoint - public access
router.get('/', search);

export default router;