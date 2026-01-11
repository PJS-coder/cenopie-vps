// Utility functions for API requests with retry logic

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryOn?: number[];
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryOn: [429, 500, 502, 503, 504] // Retry on these status codes
};

export async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const config = { ...defaultRetryOptions, ...retryOptions };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries!; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If response is ok or not in retry list, return it
      if (response.ok || !config.retryOn!.includes(response.status)) {
        return response;
      }
      
      // If this is the last attempt, return the response anyway
      if (attempt === config.maxRetries) {
        return response;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay! * Math.pow(2, attempt),
        config.maxDelay!
      );
      
      console.warn(`Request failed with status ${response.status}. Retrying in ${delay}ms... (attempt ${attempt + 1}/${config.maxRetries! + 1})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      lastError = error as Error;
      
      // If this is the last attempt, throw the error
      if (attempt === config.maxRetries) {
        throw lastError;
      }
      
      // Calculate delay for network errors
      const delay = Math.min(
        config.baseDelay! * Math.pow(2, attempt),
        config.maxDelay!
      );
      
      console.warn(`Network error: ${lastError.message}. Retrying in ${delay}ms... (attempt ${attempt + 1}/${config.maxRetries! + 1})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new Error('Max retries exceeded');
}

export async function authenticatedFetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  
  const authOptions: RequestInit = {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  };
  
  return fetchWithRetry(url, authOptions, retryOptions);
}

// Helper function to handle common API response patterns
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If not JSON, use the text as is
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
}