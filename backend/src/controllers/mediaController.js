import { uploadToCloudinary } from '../utils/cloudinary.js';

/**
 * Uploads a file to Cloudinary
 * @route POST /api/media/upload
 * @access Private
 */
export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file size (50MB limit)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxFileSize) {
      return res.status(400).json({ 
        error: 'File too large', 
        message: 'File size must be less than 50MB' 
      });
    }

    // Determine resource type based on MIME type
    let resourceType = 'image';
    if (req.file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (req.file.mimetype.startsWith('application/') || req.file.mimetype.includes('pdf')) {
      resourceType = 'raw';
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: resourceType,
      folder: 'canopie_uploads',
      use_filename: true,
      unique_filename: true,
    });

    res.status(200).json({
      message: 'File uploaded successfully',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Uploads multiple files to Cloudinary
 * @route POST /api/media/upload-multiple
 * @access Private
 */
export async function uploadMultipleFiles(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Validate file sizes (50MB limit per file)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    for (const file of req.files) {
      if (file.size > maxFileSize) {
        return res.status(400).json({ 
          error: 'File too large', 
          message: `File "${file.originalname}" is too large. Maximum size is 50MB.` 
        });
      }
    }

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map(file => {
      // Determine resource type based on MIME type
      let resourceType = 'image';
      if (file.mimetype.startsWith('video/')) {
        resourceType = 'video';
      } else if (file.mimetype.startsWith('application/') || file.mimetype.includes('pdf')) {
        resourceType = 'raw';
      }
      
      return uploadToCloudinary(file.buffer, {
        resource_type: resourceType,
        folder: 'canopie_uploads',
        use_filename: true,
        unique_filename: true,
      });
    });

    const results = await Promise.all(uploadPromises);

    const files = results.map(result => ({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
    }));

    res.status(200).json({
      message: 'Files uploaded successfully',
      data: {
        files,
      },
    });
  } catch (error) {
    next(error);
  }
}