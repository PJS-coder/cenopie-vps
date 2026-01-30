/**
 * Error handling utilities for API requests
 */

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  retryable: boolean;
}

/**
 * Parse and categorize API errors
 */
export function parseApiError(response: Response, errorText?: string): ApiError {
  const status = response.status;
  let message = `Request failed with status ${status}`;
  let code = '';
  let retryable = false;

  // Try to parse error response
  if (errorText) {
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error) {
        message = errorData.error;
      } else if (errorData.message) {
        message = errorData.message;
      }
      if (errorData.code) {
        code = errorData.code;
      }
    } catch (e) {
      // Use default message
    }
  }

  // Categorize errors
  switch (status) {
    case 400:
      message = 'Bad request. Please check your input and try again.';
      break;
    case 401:
      message = 'Authentication failed. Please log in again.';
      break;
    case 403:
      message = 'Access denied. You do not have permission for this action.';
      break;
    case 404:
      message = 'Resource not found. The requested item may have been deleted.';
      break;
    case 413:
      message = 'File too large. Please reduce the file size and try again.';
      break;
    case 429:
      message = 'Too many requests. Please wait a moment and try again.';
      retryable = true;
      break;
    case 500:
      message = 'Internal server error. Please try again later.';
      retryable = true;
      break;
    case 502:
      message = 'Bad gateway. The server is temporarily unavailable.';
      retryable = true;
      break;
    case 503:
      message = 'Service unavailable. Please try again later.';
      retryable = true;
      break;
    case 504:
      message = 'Gateway timeout. The request took too long to process.';
      retryable = true;
      break;
    case 525:
      message = 'SSL handshake failed. There is a server configuration issue. Please contact support.';
      break;
    default:
      if (status >= 500) {
        message = 'Server error. Please try again later.';
        retryable = true;
      } else if (status >= 400) {
        message = 'Client error. Please check your request and try again.';
      }
  }

  return {
    status,
    message,
    code,
    retryable
  };
}

/**
 * Get user-friendly error message for common network errors
 */
export function getNetworkErrorMessage(error: any): string {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error: Unable to connect to server. Please check your internet connection.';
  }
  
  if (error.message.includes('SSL') || error.message.includes('certificate')) {
    return 'SSL connection error. Please contact support.';
  }
  
  if (error.message.includes('timeout')) {
    return 'Request timeout. Please try again.';
  }
  
  if (error.message.includes('CORS')) {
    return 'Cross-origin request blocked. Please contact support.';
  }
  
  return 'Network error occurred. Please check your connection and try again.';
}

/**
 * Retry utility for API requests
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry non-retryable errors
      if (error.status && !isRetryableStatus(error.status)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break;
      }
      
      // Wait before retry with exponential backoff
      const delay = delayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Check if HTTP status code is retryable
 */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Format file size for error messages
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}