import multer from 'multer';

const storage = multer.memoryStorage();

// File filter to validate file types and sizes
const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    // Multer 2.x expects Error objects for rejections
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image and video files are allowed'), false);
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit to accommodate 2-minute videos
  }
});
