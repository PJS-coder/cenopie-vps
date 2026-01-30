#!/usr/bin/env node

/**
 * Test script to verify upload limits configuration
 * Run with: node test-upload-limits.js
 */

import express from 'express';
import multer from 'multer';

const app = express();

// Test multer configuration similar to the actual upload route
const videoStorage = multer.memoryStorage();
const videoUpload = multer({ 
  storage: videoStorage,
  limits: { 
    fileSize: 200 * 1024 * 1024, // 200MB
    fieldSize: 200 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter - File received:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    if (file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/octet-stream' || 
        file.originalname.endsWith('.webm') ||
        file.originalname.endsWith('.mp4')) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only video files are allowed'));
    }
  }
});

// Test endpoint
app.post('/test-upload', (req, res, next) => {
  console.log('=== TEST UPLOAD REQUEST ===');
  console.log('Content-Length:', req.headers['content-length']);
  console.log('Content-Type:', req.headers['content-type']);
  
  const contentLength = parseInt(req.headers['content-length'] || '0');
  console.log('Content-Length in MB:', (contentLength / 1024 / 1024).toFixed(2));
  
  if (contentLength > 200 * 1024 * 1024) {
    return res.status(413).json({
      error: 'File too large',
      maxSize: '200MB',
      receivedSize: `${(contentLength / 1024 / 1024).toFixed(2)}MB`
    });
  }
  
  next();
}, videoUpload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received' });
  }
  
  console.log('File successfully received:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    sizeInMB: (req.file.size / 1024 / 1024).toFixed(2) + 'MB'
  });
  
  res.json({
    success: true,
    message: 'File upload test successful',
    file: {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      sizeInMB: (req.file.size / 1024 / 1024).toFixed(2) + 'MB'
    }
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Upload error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        code: 'LIMIT_FILE_SIZE',
        maxSize: '200MB'
      });
    }
  }
  
  res.status(500).json({
    error: 'Upload failed',
    message: error.message
  });
});

const PORT = process.env.TEST_PORT || 4001;
app.listen(PORT, () => {
  console.log(`Upload test server running on port ${PORT}`);
  console.log(`Test endpoint: POST http://localhost:${PORT}/test-upload`);
  console.log('Send a video file with field name "video"');
  console.log('\nExample curl command:');
  console.log(`curl -X POST -F "video=@your-video-file.webm" http://localhost:${PORT}/test-upload`);
});