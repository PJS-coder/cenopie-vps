import express from 'express';
import { uploadFile, uploadMultipleFiles } from '../controllers/mediaController.js';
import { upload } from '../middlewares/upload.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Upload a single file (image or video) - supports both user and company tokens
router.post('/upload', protect, upload.single('file'), uploadFile);

// Upload multiple files (images or videos) - supports both user and company tokens
router.post('/upload-multiple', protect, upload.array('files', 10), uploadMultipleFiles);

export default router;