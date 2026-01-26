import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import sharp from 'sharp';

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folder = req.body.type === 'image' ? 'message-images' : 'message-files';
    const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'mp3', 'mp4', 'webm'];
    
    return {
      folder: folder,
      allowed_formats: allowedFormats,
      resource_type: file.mimetype.startsWith('video/') ? 'video' : 
                    file.mimetype.startsWith('audio/') ? 'video' : 'auto',
      public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  },
});

// Configure multer with Multer 2.x syntax
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, audio, and video files
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg',
      'audio/wav',
      'audio/webm',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Use MulterError for better error handling in Multer 2.x
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid file type. Only images, documents, audio, and video files are allowed.'));
    }
  }
});

// Upload message attachment with Multer 2.x error handling
export const uploadMessageAttachment = async (req, res) => {
  try {
    // Use multer middleware with promise-based approach for Multer 2.x
    const uploadSingle = upload.single('file');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        
        // Handle different types of Multer errors
        if (err instanceof multer.MulterError) {
          let message = 'File upload failed';
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              message = 'File too large. Maximum size is 50MB';
              break;
            case 'LIMIT_UNEXPECTED_FILE':
              message = err.message || 'Unexpected file type';
              break;
            case 'LIMIT_FILE_COUNT':
              message = 'Too many files';
              break;
            default:
              message = err.message || 'File upload failed';
          }
          return res.status(400).json({
            success: false,
            message: message,
            code: err.code
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      const file = req.file;
      const fileType = req.body.type || 'file';

      let responseData = {
        url: file.path,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        type: fileType
      };

      // For images, get dimensions and create thumbnail
      if (file.mimetype.startsWith('image/')) {
        try {
          // Get image metadata
          const metadata = await sharp(file.buffer || file.path).metadata();
          responseData.width = metadata.width;
          responseData.height = metadata.height;

          // Create thumbnail URL (Cloudinary auto-generates these)
          const thumbnailUrl = file.path.replace('/upload/', '/upload/c_thumb,w_200,h_200/');
          responseData.thumbnail = thumbnailUrl;
        } catch (imageError) {
          console.error('Error processing image:', imageError);
          // Continue without thumbnail if processing fails
        }
      }

      // For videos, extract duration and create thumbnail
      if (file.mimetype.startsWith('video/')) {
        try {
          // Cloudinary provides video metadata
          const videoInfo = await cloudinary.api.resource(file.public_id, { resource_type: 'video' });
          responseData.duration = videoInfo.duration;
          responseData.width = videoInfo.width;
          responseData.height = videoInfo.height;

          // Create video thumbnail
          const thumbnailUrl = file.path.replace('/upload/', '/upload/so_0,c_thumb,w_200,h_200/').replace(/\.[^/.]+$/, '.jpg');
          responseData.thumbnail = thumbnailUrl;
        } catch (videoError) {
          console.error('Error processing video:', videoError);
        }
      }

      // For audio files, extract duration
      if (file.mimetype.startsWith('audio/')) {
        try {
          const audioInfo = await cloudinary.api.resource(file.public_id, { resource_type: 'video' });
          responseData.duration = audioInfo.duration;
        } catch (audioError) {
          console.error('Error processing audio:', audioError);
        }
      }

      res.json({
        success: true,
        data: responseData,
        message: 'File uploaded successfully'
      });
    });

  } catch (error) {
    console.error('Upload controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during file upload'
    });
  }
};

// Upload profile image with Multer 2.x error handling
export const uploadProfileImage = async (req, res) => {
  try {
    const uploadSingle = upload.single('image');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: err.message || 'Image upload failed',
            code: err.code
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || 'Image upload failed'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image provided'
        });
      }

      res.json({
        success: true,
        data: {
          url: req.file.path,
          public_id: req.file.public_id
        },
        message: 'Image uploaded successfully'
      });
    });

  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during image upload'
    });
  }
};

// Delete file from Cloudinary
export const deleteFile = async (req, res) => {
  try {
    const { public_id, resource_type = 'image' } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type
    });

    res.json({
      success: true,
      data: result,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
};