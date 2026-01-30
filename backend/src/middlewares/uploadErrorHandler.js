import multer from 'multer';

/**
 * Enhanced error handler for upload operations
 * Provides user-friendly error messages and proper HTTP status codes
 */
export const uploadErrorHandler = (error, req, res, next) => {
  console.error('Upload error occurred:', {
    error: error.message,
    code: error.code,
    field: error.field,
    url: req.originalUrl,
    method: req.method,
    contentLength: req.headers['content-length'],
    userAgent: req.headers['user-agent']
  });

  // Handle Multer-specific errors
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        const maxSize = getMaxSizeForEndpoint(req.originalUrl);
        const maxSizeMB = Math.round(maxSize / 1024 / 1024);
        
        return res.status(413).json({
          success: false,
          error: `File too large. Maximum size is ${maxSizeMB}MB.`,
          code: 'FILE_TOO_LARGE',
          maxSize: `${maxSizeMB}MB`,
          details: 'Please compress your video or choose a smaller file.'
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files uploaded.',
          code: 'TOO_MANY_FILES',
          details: 'Please upload one file at a time.'
        });

      case 'LIMIT_FIELD_KEY':
        return res.status(400).json({
          success: false,
          error: 'Field name too long.',
          code: 'FIELD_NAME_TOO_LONG'
        });

      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({
          success: false,
          error: 'Field value too long.',
          code: 'FIELD_VALUE_TOO_LONG'
        });

      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many fields.',
          code: 'TOO_MANY_FIELDS'
        });

      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field or invalid file type.',
          code: 'INVALID_FILE_TYPE',
          details: 'Please check the file type and field name.'
        });

      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many parts in multipart data.',
          code: 'TOO_MANY_PARTS'
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'File upload error.',
          code: 'UPLOAD_ERROR',
          details: error.message
        });
    }
  }

  // Handle other upload-related errors
  if (error.message && error.message.includes('ECONNRESET')) {
    return res.status(408).json({
      success: false,
      error: 'Upload timeout. Please try again with a smaller file.',
      code: 'UPLOAD_TIMEOUT',
      details: 'The connection was reset during upload.'
    });
  }

  if (error.message && error.message.includes('EMFILE')) {
    return res.status(503).json({
      success: false,
      error: 'Server temporarily unavailable. Please try again later.',
      code: 'SERVER_BUSY',
      details: 'Too many files being processed simultaneously.'
    });
  }

  // Handle Cloudinary errors
  if (error.message && error.message.includes('cloudinary')) {
    return res.status(502).json({
      success: false,
      error: 'File processing failed. Please try again.',
      code: 'PROCESSING_ERROR',
      details: 'External service error during file processing.'
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    error: 'Upload failed due to server error.',
    code: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later.'
  });
};

/**
 * Get maximum file size based on endpoint
 */
function getMaxSizeForEndpoint(url) {
  if (url.includes('/interview-video')) {
    return process.env.VIDEO_UPLOAD_LIMIT || 200 * 1024 * 1024;
  }
  return process.env.GENERAL_UPLOAD_LIMIT || 50 * 1024 * 1024;
}

/**
 * Middleware to add upload size information to request
 */
export const uploadSizeLogger = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  
  if (contentLength > 0) {
    console.log(`Upload request: ${req.method} ${req.originalUrl}`, {
      contentLength: contentLength,
      contentLengthMB: (contentLength / 1024 / 1024).toFixed(2) + 'MB',
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']?.substring(0, 100)
    });
  }
  
  next();
};