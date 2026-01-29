import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import sharp from 'sharp';

// Configure multer for memory storage (more compatible approach)
const storage = multer.memoryStorage();

// Configure multer with file validation
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
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid file type. Only images, documents, audio, and video files are allowed.'));
    }
  }
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'message-attachments',
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
};

// Upload message attachment with direct Cloudinary upload
export const uploadMessageAttachment = async (req, res) => {
  try {
    // File is already processed by multer middleware in routes
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const file = req.file;
    const fileType = req.body.type || 'file';

    try {
      // Determine resource type for Cloudinary
      let resourceType = 'auto';
      let folder = 'message-attachments';
      
      if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
        folder = 'message-images';
        } else if (file.mimetype.startsWith('video/')) {
          resourceType = 'video';
          folder = 'message-videos';
        } else if (file.mimetype.startsWith('audio/')) {
          resourceType = 'video'; // Cloudinary uses 'video' for audio files
          folder = 'message-audio';
        }

        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(file.buffer, {
          resource_type: resourceType,
          folder: folder,
          public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        });

        let responseData = {
          url: uploadResult.secure_url,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          type: fileType,
          public_id: uploadResult.public_id
        };

        // For images, get dimensions and create thumbnail
        if (file.mimetype.startsWith('image/')) {
          try {
            // Get image metadata using sharp
            const metadata = await sharp(file.buffer).metadata();
            responseData.width = metadata.width;
            responseData.height = metadata.height;

            // Create thumbnail URL using Cloudinary transformations
            const thumbnailUrl = uploadResult.secure_url.replace('/upload/', '/upload/c_thumb,w_200,h_200/');
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
            responseData.duration = uploadResult.duration;
            responseData.width = uploadResult.width;
            responseData.height = uploadResult.height;

            // Create video thumbnail using Cloudinary transformations
            const thumbnailUrl = uploadResult.secure_url.replace('/upload/', '/upload/so_0,c_thumb,w_200,h_200/').replace(/\.[^/.]+$/, '.jpg');
            responseData.thumbnail = thumbnailUrl;
          } catch (videoError) {
            console.error('Error processing video:', videoError);
          }
        }

        // For audio files, extract duration
        if (file.mimetype.startsWith('audio/')) {
          try {
            responseData.duration = uploadResult.duration;
          } catch (audioError) {
            console.error('Error processing audio:', audioError);
          }
        }

        res.json({
          success: true,
          data: responseData,
          message: 'File uploaded successfully'
        });

      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        res.status(500).json({
          success: false,
          message: 'Failed to upload file to cloud storage'
        });
      }

  } catch (error) {
    console.error('Upload controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during file upload'
    });
  }
};

// Upload profile image with direct Cloudinary upload
export const uploadProfileImage = async (req, res) => {
  try {
    // File is already processed by multer middleware in routes
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    try {
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        resource_type: 'image',
        folder: 'profile-images',
        public_id: `profile-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      });

      res.json({
        success: true,
        data: {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        },
        message: 'Image uploaded successfully'
      });

    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image to cloud storage'
      });
    }

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