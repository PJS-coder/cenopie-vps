import express from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadMessageAttachment, uploadProfileImage, deleteFile } from '../controllers/uploadController.js';

const router = express.Router();

// Configure multer for interview video uploads specifically
const videoStorage = multer.memoryStorage();
const videoUpload = multer({ 
  storage: videoStorage,
  limits: { 
    fileSize: 200 * 1024 * 1024, // Increased to 200MB for longer interviews
    fieldSize: 200 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    console.log('Video upload - File received:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'Unknown'
    });
    
    // Allow video files and also allow files without mimetype (some browsers don't set it correctly)
    if (file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/octet-stream' || 
        file.mimetype === '' || 
        !file.mimetype ||
        file.originalname.endsWith('.webm') ||
        file.originalname.endsWith('.mp4')) {
      console.log('Video file accepted');
      cb(null, true);
    } else {
      console.error('Invalid file type for video upload:', file.mimetype);
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only video files are allowed for interview uploads'));
    }
  }
});

// Configure multer for general uploads (images, documents, etc.)
const generalStorage = multer.memoryStorage();
const generalUpload = multer({ 
  storage: generalStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    console.log('General upload - File received:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    // Allow images, documents, and audio files for general uploads
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg', 'audio/wav', 'audio/webm'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error('Invalid file type for general upload:', file.mimetype);
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'File type not allowed for this upload'));
    }
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Upload route is working!' });
});

// Upload message attachment
router.post('/message-attachment', protect, generalUpload.single('file'), uploadMessageAttachment);

// Upload profile image  
router.post('/profile-image', protect, generalUpload.single('image'), uploadProfileImage);

// Delete file
router.delete('/file', protect, deleteFile);

// Upload interview video
router.post('/interview-video', protect, videoUpload.single('video'), async (req, res) => {
  try {
    console.log('=== INTERVIEW VIDEO UPLOAD REQUEST ===');
    console.log('User:', req.user?.email);
    console.log('Headers:', req.headers['content-type']);
    
    if (!req.file) {
      console.error('No video file in request');
      return res.status(400).json({ 
        success: false,
        error: 'No video file provided' 
      });
    }

    console.log('Video file received:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      sizeInMB: (req.file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    // Validate file size
    if (req.file.size === 0) {
      console.error('Empty video file received');
      return res.status(400).json({ 
        success: false,
        error: 'Empty video file' 
      });
    }

    // Upload to Cloudinary
    console.log('Starting Cloudinary upload for interview video...');
    
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'interview-videos',
          chunk_size: 20000000, // Increased to 20MB chunks for faster upload
          timeout: 180000, // Reduced to 3 minutes (faster processing)
          eager_async: true, // Process video asynchronously
          public_id: `interview-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          // Aggressive optimization for faster uploads
          quality: 'auto:low', // Lower quality for faster upload
          fetch_format: 'auto',
          // Video compression settings
          video_codec: 'h264', // H.264 for better compression
          bit_rate: '1000k', // 1 Mbps bitrate
          fps: 24, // Reduce FPS for smaller files
          // Audio optimization
          audio_codec: 'aac',
          audio_frequency: 44100
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', {
              url: result.secure_url,
              publicId: result.public_id,
              duration: result.duration,
              format: result.format,
              bytes: result.bytes,
              sizeInMB: (result.bytes / 1024 / 1024).toFixed(2) + 'MB',
              compressionRatio: ((result.bytes / req.file.size) * 100).toFixed(1) + '%'
            });
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
      publicId: result.public_id,
      duration: result.duration,
      format: result.format
    });

  } catch (error) {
    console.error('Interview video upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload interview video',
      details: error.message 
    });
  }
});

export default router;
