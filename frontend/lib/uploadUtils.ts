/**
 * Upload utilities for handling file uploads and errors
 */

export interface UploadError {
  success: false;
  error: string;
  code: string;
  maxSize?: string;
  receivedSize?: string;
  details?: string;
}

export interface UploadSuccess {
  success: true;
  url: string;
  publicId?: string;
  duration?: number;
  format?: string;
}

export type UploadResponse = UploadSuccess | UploadError;

/**
 * Get user-friendly error message for upload errors
 */
export function getUploadErrorMessage(error: UploadError): string {
  switch (error.code) {
    case 'FILE_TOO_LARGE':
      return `File is too large. Maximum size allowed is ${error.maxSize || '200MB'}. Your file is ${error.receivedSize || 'unknown size'}.`;
    
    case 'INVALID_FILE_TYPE':
      return 'Invalid file type. Please upload a video file (MP4, WebM, etc.).';
    
    case 'UPLOAD_TIMEOUT':
      return 'Upload timed out. Please try again with a smaller file or check your internet connection.';
    
    case 'SERVER_BUSY':
      return 'Server is busy processing other uploads. Please wait a moment and try again.';
    
    case 'PROCESSING_ERROR':
      return 'Failed to process your video. Please try again or contact support if the problem persists.';
    
    case 'NETWORK_ERROR':
      return 'Network error occurred during upload. Please check your connection and try again.';
    
    default:
      return error.error || 'Upload failed. Please try again.';
  }
}

/**
 * Get user-friendly suggestions for upload errors
 */
export function getUploadErrorSuggestions(error: UploadError): string[] {
  const suggestions: string[] = [];
  
  switch (error.code) {
    case 'FILE_TOO_LARGE':
      suggestions.push('Try compressing your video using a video editing tool');
      suggestions.push('Record at a lower resolution or shorter duration');
      suggestions.push('Use a different video format that compresses better');
      break;
    
    case 'INVALID_FILE_TYPE':
      suggestions.push('Make sure you\'re uploading a video file');
      suggestions.push('Supported formats: MP4, WebM, MOV, AVI');
      suggestions.push('Try converting your file to MP4 format');
      break;
    
    case 'UPLOAD_TIMEOUT':
      suggestions.push('Check your internet connection speed');
      suggestions.push('Try uploading during off-peak hours');
      suggestions.push('Compress your video to reduce file size');
      break;
    
    case 'SERVER_BUSY':
      suggestions.push('Wait a few minutes and try again');
      suggestions.push('Try uploading during off-peak hours');
      break;
    
    case 'PROCESSING_ERROR':
      suggestions.push('Try uploading a different video file');
      suggestions.push('Make sure your video file is not corrupted');
      suggestions.push('Contact support if the problem continues');
      break;
    
    default:
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page and uploading again');
      suggestions.push('Contact support if the problem persists');
  }
  
  return suggestions;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file size is within limits
 */
export function validateFileSize(file: File, maxSizeBytes: number): { valid: boolean; error?: string } {
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${formatFileSize(maxSizeBytes)}.`
    };
  }
  
  return { valid: true };
}

/**
 * Check if file type is valid for video uploads
 */
export function validateVideoFileType(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/avi'
  ];
  
  const allowedExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  
  const isValidType = allowedTypes.includes(file.type);
  const isValidExtension = allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!isValidType && !isValidExtension) {
    return {
      valid: false,
      error: `Invalid file type. Please upload a video file (${allowedExtensions.join(', ')}).`
    };
  }
  
  return { valid: true };
}

/**
 * Upload progress tracker
 */
export class UploadProgressTracker {
  private onProgress?: (progress: number) => void;
  private onComplete?: (result: UploadResponse) => void;
  private onError?: (error: UploadError) => void;
  
  constructor(callbacks: {
    onProgress?: (progress: number) => void;
    onComplete?: (result: UploadResponse) => void;
    onError?: (error: UploadError) => void;
  }) {
    this.onProgress = callbacks.onProgress;
    this.onComplete = callbacks.onComplete;
    this.onError = callbacks.onError;
  }
  
  async uploadFile(file: File, endpoint: string): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('video', file);
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          this.onProgress?.(progress);
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        try {
          const response: UploadResponse = JSON.parse(xhr.responseText);
          
          if (response.success) {
            this.onComplete?.(response);
            resolve(response);
          } else {
            this.onError?.(response);
            reject(response);
          }
        } catch (error) {
          const errorResponse: UploadError = {
            success: false,
            error: 'Failed to parse server response',
            code: 'PARSE_ERROR'
          };
          this.onError?.(errorResponse);
          reject(errorResponse);
        }
      });
      
      // Handle network errors
      xhr.addEventListener('error', () => {
        const errorResponse: UploadError = {
          success: false,
          error: 'Network error occurred during upload',
          code: 'NETWORK_ERROR'
        };
        this.onError?.(errorResponse);
        reject(errorResponse);
      });
      
      // Handle timeout
      xhr.addEventListener('timeout', () => {
        const errorResponse: UploadError = {
          success: false,
          error: 'Upload timed out',
          code: 'UPLOAD_TIMEOUT'
        };
        this.onError?.(errorResponse);
        reject(errorResponse);
      });
      
      // Configure request
      xhr.timeout = 300000; // 5 minutes timeout
      xhr.open('POST', endpoint);
      
      // Add auth header if available
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      // Start upload
      xhr.send(formData);
    });
  }
}