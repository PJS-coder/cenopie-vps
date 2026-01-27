import express from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadMessageAttachment, uploadProfileImage, deleteFile } from '../controllers/uploadController.js';

const router = express.Router();

// Configure multer for memory storage with Multer 2.x compatibility
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Add basic file validation for Multer 2.x
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only video and image files are allowed'));
    }
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Upload route is working!' });
});

// Upload message attachment
router.post('/message-attachment', protect, uploadMessageAttachment);

// Upload profile image
router.post('/profile-image', protect, uploadProfileImage);

// Delete file
router.delete('/file', protect, deleteFile);

// Upload interview video
router.post('/interview-video', protect, upload.single('video'), async (req, res) => {
  try {
    console.log('=== UPLOAD REQUEST RECEIVED ===');
    console.log('User:', req.user?.email);
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No video file provided' });
    }

    console.log('File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      sizeInMB: (req.file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    // Upload to Cloudinary
    console.log('Starting Cloudinary upload...');
    
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'interview-videos',
          chunk_size: 6000000,
          timeout: 120000
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );

      const bufferStream = Readable.from(req.file.buffer);
      bufferStream.pipe(uploadStream);
    });

    const result = await uploadPromise;

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload video',
      details: error.message 
    });
  }
});

export default router;
