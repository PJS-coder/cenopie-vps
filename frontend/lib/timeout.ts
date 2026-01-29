/**
 * Utility functions for handling request timeouts
 */

export interface TimeoutOptions {
  timeout?: number;
  timeoutMessage?: string;
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeout Timeout in milliseconds (default: 10000)
 * @param timeoutMessage Custom timeout message
 * @returns Promise that rejects if timeout is reached
 */
export function withTimeout<T>(
  promise: Promise<T>, 
  timeout: number = 10000,
  timeoutMessage: string = 'Request timed out. Please check your connection and try again.'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeout);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Creates a timeout promise that rejects after specified time
 * @param timeout Timeout in milliseconds
 * @param message Error message
 * @returns Promise that rejects after timeout
 */
export function createTimeout(
  timeout: number, 
  message: string = 'Operation timed out'
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeout);
  });
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in milliseconds
 * @returns Promise that resolves with the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Common timeout configurations
 */
export const TIMEOUT_CONFIGS = {
  FAST: 5000,      // 5 seconds - for quick operations
  NORMAL: 10000,   // 10 seconds - for normal operations
  SLOW: 15000,     // 15 seconds - for slow operations like file uploads
  VERY_SLOW: 30000 // 30 seconds - for very slow operations
} as const;