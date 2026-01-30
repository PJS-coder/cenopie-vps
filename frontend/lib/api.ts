// API service for handling requests to the backend
import { apiCache } from './performance';

// Get API base URL with proper fallback for production
const getApiBaseUrl = (): string => {
  // In browser environment
  if (typeof window !== 'undefined') {
    // Check if we're on the production domain
    if (window.location.hostname === 'cenopie.com' || window.location.hostname === 'www.cenopie.com') {
      return 'https://cenopie.com';
    }
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    }
  }
  
  // Fallback to environment variable or production URL
  return process.env.NEXT_PUBLIC_API_URL || 'https://cenopie.com';
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  [key: string]: unknown; // Allow other properties
}

// User profile interface
interface UserProfile {
  _id: string;
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  headline?: string;
  bio?: string;
  location?: string;
  pronouns?: string;
  links?: { label: string; url: string }[];
  education?: {
    _id?: string;
    college: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear: number;
    current: boolean;
  }[];
  experience?: {
    _id?: string;
    company: string;
    jobTitle: string;
    employmentType: string;
    startDate: string;
    endDate?: string;
    description?: string;
    current: boolean;
  }[];
  skills?: {
    _id?: string;
    name: string;
  }[];
  profileImage?: string;
  bannerImage?: string;
  interviewsCompleted?: number;
  applicationsSent?: number;
  profileViews?: number;
  successRate?: number;
  followers?: string[];
  following?: string[];
  createdAt: string;
}

// Suggested user interface
interface SuggestedUser {
  id: string;
  name: string;
  role: string;
  company: string;
  profileImage?: string;
  connected: boolean;
}

// Auth response interface
interface AuthResponse {
  token: string;
  refresh: string;
  user: UserProfile;
}

// Enhanced request queue with priority and batching
interface QueuedRequest {
  fn: () => Promise<any>;
  priority: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  key?: string; // For deduplication
  timestamp: number;
}

interface BatchRequest {
  endpoint: string;
  ids: string[];
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

const requestQueue: QueuedRequest[] = [];
const batchQueue: Map<string, BatchRequest> = new Map();
let isProcessingQueue = false;
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 8; // Increased for better throughput
const BATCH_DELAY = 50; // ms to wait for batching
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

const processRequestQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return;
  }
  
  isProcessingQueue = true;
  
  // Process batched requests first
  if (batchQueue.size > 0) {
    for (const [endpoint, batch] of batchQueue.entries()) {
      if (activeRequests >= MAX_CONCURRENT_REQUESTS) break;
      
      activeRequests++;
      batchQueue.delete(endpoint);
      
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: batch.ids })
        });
        const data = await response.json();
        batch.resolve(data);
      } catch (error) {
        batch.reject(error);
      } finally {
        activeRequests--;
      }
    }
  }
  
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    // Sort by priority (higher number = higher priority)
    requestQueue.sort((a, b) => b.priority - a.priority);
    
    const request = requestQueue.shift();
    if (request) {
      activeRequests++;
      
      request.fn()
        .then(request.resolve)
        .catch(request.reject)
        .finally(() => {
          activeRequests--;
          // Process next batch immediately
          processRequestQueue();
        });
    }
  }
  
  isProcessingQueue = false;
};

const enqueueRequest = <T>(requestFn: () => Promise<T>, priority: number = 1, key?: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    requestQueue.push({
      fn: requestFn,
      priority,
      resolve,
      reject,
      key,
      timestamp: Date.now(),
    });
    processRequestQueue();
  });
};

// Helper function to make authenticated requests with priority
export const authenticatedRequest = async <T = any>(
  endpoint: string,
  config: RequestInit = {},
  priority: number = 1
): Promise<ApiResponse<T>> => {
  return enqueueRequest(
    () => performAuthenticatedRequest<T>(endpoint, config),
    priority
  );
};

const performAuthenticatedRequest = async <T = any>(
  endpoint: string,
  config: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }
  
  // For FormData requests, we should not set Content-Type header as browser will set it with boundary
  const isFormData = config.body instanceof FormData;
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  const defaultConfig: RequestInit = {
    headers: {
      'Authorization': `Bearer ${token}`,
      // Only set Content-Type to application/json if it's not FormData
      ...(!isFormData && { 'Content-Type': 'application/json' }),
    },
    signal: controller.signal, // Add abort signal
  };
  
  // Debug logging removed for production
  
  const finalConfig = {
    ...defaultConfig,
    ...config,
    headers: {
      ...defaultConfig.headers,
      ...config.headers,
    },
  };
  
  // Implement retry logic for rate limiting
  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    try {
      // Add a small delay before each request to prevent rate limiting
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * retries));
      }
      
      let response: Response | null = null;
      
      try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, finalConfig);
        clearTimeout(timeoutId); // Clear timeout on successful response
      } catch (fetchError) {
        clearTimeout(timeoutId); // Clear timeout on error
        console.error('Fetch error:', fetchError);
        
        // Handle abort error (timeout)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The server may be experiencing high load. Please try again later.');
        }
        
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        }
        throw fetchError;
      }
      
      // Null check for response
      if (!response) {
        throw new Error('No response received from server');
      }
      
      // Handle rate limiting (429) with exponential backoff
      if (response.status === 429) {
        retries++;
        if (retries > maxRetries) {
          // Instead of throwing immediately, return a user-friendly error
          return Promise.reject(new Error(`Server is busy. Please try again in a few moments.`));
        }
        
        // Rate limited - retry with exponential backoff
        const retryAfter = response.headers.get('Retry-After');
        const retryTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(1000 * Math.pow(2, retries), 10000);
        
        // Wait for the specified time before retrying
        await new Promise(resolve => setTimeout(resolve, retryTime));
        continue; // Retry the request
      }
      
      // If we get a 401, try to refresh the token and retry the request
      if (response.status === 401 && retries === 0) { // Only try to refresh token once
        try {
          const newToken = await authApi.refresh();
          // Retry the request with the new token
          const retryConfig: RequestInit = {
            ...config,
            headers: {
              ...config.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          };
          response = await fetch(`${API_BASE_URL}${endpoint}`, retryConfig);
          
          // Null check for retry response
          if (!response) {
            throw new Error('No response received from server on retry');
          }
          
          // Check if retry also failed with 429
          if (response.status === 429) {
            retries++;
            if (retries > maxRetries) {
              // Instead of throwing immediately, return a user-friendly error
              return Promise.reject(new Error(`Server is busy. Please try again in a few moments.`));
            }
            
            const retryAfter = response.headers.get('Retry-After');
            const retryTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(1000 * Math.pow(2, retries), 10000);
            
            // Wait for the specified time before retrying
            await new Promise(resolve => setTimeout(resolve, retryTime));
            continue; // Retry the request
          }
        } catch (refreshError) {
          // If refresh fails, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      }
      
      if (!response.ok) {
        // Handle error response
        let errorData: any = null;
        let errorDetails = '';
        
        // Try to get error details from response
        
        try {
          errorData = await response.json();
        } catch (jsonError: any) {
          try {
            errorDetails = await response.text();
          // Check if the response contains multipart boundaries
          if (errorDetails.includes('------WebKitFormBoundary')) {
            console.error('Received multipart form data instead of JSON. This suggests a server configuration issue.');
            errorDetails = 'Server configuration error: Received form data instead of JSON response';
          }
          } catch (textError: any) {
            console.error('API Error Response (No details available)');
            console.error('Response status:', response.status);
            console.error('Response status text:', response.statusText);
          }
        }
        
        let errorMessage = 'An unknown error occurred';
        
        try {
          if (errorData && typeof errorData === 'object' && errorData !== null) {
            if ((errorData as { message?: string }).message) {
              errorMessage = (errorData as { message?: string }).message!;
            } else if (Object.keys(errorData).length > 0) {
              errorMessage = JSON.stringify(errorData);
            }
          } else if (errorDetails) {
            errorMessage = errorDetails;
          } else if (response.statusText) {
            errorMessage = response.statusText;
          } else {
            errorMessage = `HTTP error! status: ${response.status}`;
          }
        } catch (msgError) {
          console.error('Error constructing error message:', msgError);
          errorMessage = `HTTP error! status: ${response.status}`;
        }
                              
        throw new Error(errorMessage || 'An unknown error occurred');
      }
      
      // Check content type to determine how to parse the response
      const contentType = response.headers ? response.headers.get('content-type') : null;
      
      // If it's JSON, parse it normally
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Response data:', data);
        return data;
      }
      
      // If it's not JSON but we expected JSON, try to parse it anyway
      const text = await response.text();
      
      // Check if response contains multipart boundaries
      if (text.includes('------WebKitFormBoundary')) {
        throw new Error('Server configuration error: Received form data instead of JSON response');
      }
      
      // Try to parse as JSON anyway
      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        throw new Error('Invalid response format received from server.');
      }
    } catch (error) {
      // Handle request errors
      
      // Check if this is a JSON parsing error
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        return Promise.reject(new Error('Invalid response format received from server. The server may be returning HTML or text instead of JSON.'));
      }
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Don't retry network errors
        return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection and try again.'));
      }
      
      // For other errors, retry if we haven't exceeded max retries
      if (retries < maxRetries) {
        retries++;
        const retryTime = Math.min(1000 * Math.pow(2, retries), 5000); // Exponential backoff, max 5 seconds
        await new Promise(resolve => setTimeout(resolve, retryTime));
        continue;
      }
      
      // If we've exceeded max retries, return the error
      return Promise.reject(error);
    }
  }
  
  // This should never be reached
  return Promise.reject(new Error('Unexpected error in authenticatedRequest'));
  } catch (error) {
    console.error('Unexpected error in performAuthenticatedRequest:', error);
    return Promise.reject(error instanceof Error ? error : new Error('Unknown error occurred'));
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = '';
        let errorData: Record<string, unknown> = {};
        
        try {
          errorData = await response.json();
        } catch (jsonError) {
          try {
            errorDetails = await response.text();
          } catch (textError) {
            // If both fail, we'll use the status text
          }
        }
        
        const errorMessage = (errorData.message as string) || 
                            errorDetails || 
                            response.statusText || 
                            `HTTP error! status: ${response.status}`;
                            
        throw new Error(errorMessage);
      }
      
      const data: AuthResponse = await response.json();
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refresh);
      // Store user data
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        // Dispatch a storage event to notify other components of the change
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'currentUser',
          newValue: JSON.stringify(data.user),
          url: window.location.href
        }));
      }
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw error;
    }
  },
  
  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Signup failed');
      }
      
      const data: AuthResponse = await response.json();
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refresh);
      // Store user data
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        // Dispatch a storage event to notify other components of the change
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'currentUser',
          newValue: JSON.stringify(data.user),
          url: window.location.href
        }));
      }
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw error;
    }
  },
  
  refresh: async (): Promise<string> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Token refresh failed');
      }
      
      const data = await response.json();
      // Update the auth token
      localStorage.setItem('authToken', data.token);
      return data.token;
    } catch (error) {
      // If refresh fails, clear all tokens and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      throw error;
    }
  },
  
  logout: async (): Promise<void> => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
      });
    } catch (error) {
      // Silently ignore logout errors
      console.warn('Logout error:', error);
    }
  },
};

// Profile API
export const profileApi = {
  getProfile: async (): Promise<ApiResponse<{ user: UserProfile }>> => {
    try {
      // Check cache first
      const cached = apiCache.get('USER_PROFILE');
      if (cached) {
        return cached;
      }

      // Fetch from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await authenticatedRequest('/api/profile', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Cache the result for 2 minutes (profile data changes less frequently)
      apiCache.set('USER_PROFILE', response, 2 * 60 * 1000);
      
      return response;
    } catch (error) {
      // Try to return cached data even if expired
      const staleCache = apiCache.get('USER_PROFILE');
      if (staleCache) {
        return staleCache;
      }
      throw error;
    }
  },
  updateProfile: async (userData: Partial<UserProfile> | FormData): Promise<ApiResponse<UserProfile>> => {
    const isFormData = userData instanceof FormData;
    const response = await authenticatedRequest('/api/profile/me', {
      method: 'PUT',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? userData : JSON.stringify(userData),
    });
    
    // Clear profile cache after update
    apiCache.delete('USER_PROFILE');
    
    return response;
  },
  getProfileById: (userId: string): Promise<ApiResponse<{ user: UserProfile }>> => authenticatedRequest(`/api/profile/${userId}`),
  // New endpoint for suggested users
  getSuggestedUsers: (): Promise<ApiResponse<SuggestedUser[]>> => authenticatedRequest('/api/users/suggested'),
  
  // Education CRUD operations
  addEducation: (educationData: Record<string, unknown>): Promise<ApiResponse<{ user: { education: unknown[] } }>> => authenticatedRequest('/api/profile/education/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(educationData),
  }),
  updateEducation: (educationId: string, educationData: Record<string, unknown>): Promise<ApiResponse<{ user: { education: unknown[] } }>> => authenticatedRequest(`/api/profile/education/update/${educationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(educationData),
  }),
  deleteEducation: (educationId: string): Promise<ApiResponse<{ user: { education: unknown[] } }>> => authenticatedRequest(`/api/profile/education/delete/${educationId}`, {
    method: 'DELETE',
  }),
  
  // Experience CRUD operations
  addExperience: (experienceData: Record<string, unknown>): Promise<ApiResponse<{ user: { experience: unknown[] } }>> => authenticatedRequest('/api/profile/experience/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(experienceData),
  }),
  updateExperience: (experienceId: string, experienceData: Record<string, unknown>): Promise<ApiResponse<{ user: { experience: unknown[] } }>> => authenticatedRequest(`/api/profile/experience/update/${experienceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(experienceData),
  }),
  deleteExperience: (experienceId: string): Promise<ApiResponse<{ user: { experience: unknown[] } }>> => authenticatedRequest(`/api/profile/experience/delete/${experienceId}`, {
    method: 'DELETE',
  }),
  
  // Skills CRUD operations
  addSkill: (skillData: Record<string, unknown>): Promise<ApiResponse<{ user: { skills: unknown[] } }>> => authenticatedRequest('/api/profile/skills/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(skillData),
  }),
  updateSkill: (skillId: string, skillData: Record<string, unknown>): Promise<ApiResponse<{ user: { skills: unknown[] } }>> => authenticatedRequest(`/api/profile/skills/update/${skillId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(skillData),
  }),
  deleteSkill: (skillId: string): Promise<ApiResponse<{ user: { skills: unknown[] } }>> => authenticatedRequest(`/api/profile/skills/delete/${skillId}`, {
    method: 'DELETE',
  }),
  
  // Certifications CRUD operations
  addCertification: (certificationData: Record<string, unknown>): Promise<ApiResponse<{ user: { certifications: unknown[] } }>> => authenticatedRequest('/api/profile/certifications/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(certificationData),
  }),
  updateCertification: (certificationId: string, certificationData: Record<string, unknown>): Promise<ApiResponse<{ user: { certifications: unknown[] } }>> => authenticatedRequest(`/api/profile/certifications/update/${certificationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(certificationData),
  }),
  deleteCertification: (certificationId: string): Promise<ApiResponse<{ user: { certifications: unknown[] } }>> => authenticatedRequest(`/api/profile/certifications/delete/${certificationId}`, {
    method: 'DELETE',
  }),
};

// Feed API
interface Post {
  _id: string;
  content: string;
  image?: string;
  mediaType?: string;
  author: UserProfile;
  likes: string[] | number;
  isLiked?: boolean;
  comments: {
    _id: string;
    text: string;
    author: UserProfile;
    createdAt: string;
  }[];
  createdAt: string;
}

export const feedApi = {
  getFeed: async (filter?: 'all' | 'following', page: number = 1): Promise<ApiResponse<Post[]>> => {
    // Fetch from API with filter and pagination parameters
    const filterParam = filter ? `filter=${filter}` : '';
    const pageParam = `page=${page}`;
    const limitParam = `limit=10`;
    
    const queryParams = [filterParam, pageParam, limitParam].filter(Boolean).join('&');
    const queryString = queryParams ? `?${queryParams}` : '';
    
    return await authenticatedRequest(`/api/posts/feed${queryString}`);
  },
  getUserPosts: (userId: string): Promise<ApiResponse<Post[]>> => authenticatedRequest(`/api/posts/user/${userId}`),
  createPost: (postData: { content: string; image?: string; mediaType?: string }): Promise<ApiResponse<Post>> => authenticatedRequest('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  }),
  likePost: async (postId: string): Promise<ApiResponse<Post>> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Like API error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in likePost API:', error);
      throw error;
    }
  },
  getPostById: (postId: string): Promise<ApiResponse<Post>> => authenticatedRequest(`/api/posts/${postId}`, {
    method: 'GET',
  }),
  commentOnPost: (postId: string, text: string): Promise<ApiResponse<Post>> => authenticatedRequest(`/api/posts/${postId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }),
  deleteComment: (postId: string, commentId: string): Promise<ApiResponse<Post>> => authenticatedRequest(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  }),
  repostPost: (postId: string, repostComment?: string): Promise<ApiResponse<Post>> => {
    console.log('API: Reposting post', postId, 'with comment:', repostComment);
    return authenticatedRequest(`/api/posts/${postId}/repost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repostComment: repostComment || '' }),
    }).then(response => {
      console.log('API: Repost response:', response);
      return response;
    }).catch(error => {
      console.error('API: Repost error:', error);
      throw error;
    });
  },
  deletePost: (postId: string): Promise<ApiResponse<void>> => authenticatedRequest(`/api/posts/${postId}`, {
    method: 'DELETE',
  }),
};

// Media API
export const mediaApi = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'File upload failed');
    }
    
    const data = await response.json();
    return data.data.url;
  },
};

// Messages API
interface Message {
  _id: string;
  from: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  to: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  text: string;
  createdAt: string;
  updatedAt?: string;
}

interface ChatResponse {
  _id: string;
  last: string;
  name: string;
}

export const messagesApi = {
  // Get list of conversations
  getChats: async (): Promise<ApiResponse<ChatResponse[]>> => {
    try {
      const result = await authenticatedRequest('/api/messages/chats');
      return result as unknown as Promise<ApiResponse<ChatResponse[]>>;
    } catch (error) {
      console.error('getChats error:', error);
      throw error;
    }
  },
  
  // Get messages for a specific conversation
  getMessages: async (userId: string): Promise<ApiResponse<Message[]>> => {
    // Validate userId before making the request
    if (!userId) {
      console.error('Validation failed: User ID is required');
      return Promise.reject(new Error('User ID is required'));
    }
    
    // Basic validation of userId format
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      console.error('Validation failed: Invalid User ID format');
      return Promise.reject(new Error('Invalid User ID format'));
    }
    
    try {
      const result = await authenticatedRequest(`/api/messages/${userId}`);
      return result as unknown as Promise<ApiResponse<Message[]>>;
    } catch (error) {
      console.error('getMessages error for userId', userId, ':', error);
      // Provide more specific error handling
      if (error instanceof Error) {
        if (error.message.includes('Invalid user ID')) {
          return Promise.reject(new Error('Invalid user ID provided'));
        }
        if (error.message.includes('404')) {
          return Promise.reject(new Error('User not found'));
        }
        if (error.message.includes('401')) {
          return Promise.reject(new Error('Authentication required'));
        }
        if (error.message.includes('403')) {
          return Promise.reject(new Error('Access denied'));
        }
        // Handle network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          return Promise.reject(new Error('Network error. Please check your connection and try again.'));
        }
      }
      return Promise.reject(new Error(`Failed to load messages: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  },
  
  // Get or create conversation with a user
  getOrCreateConversation: (userId: string): Promise<ApiResponse<{conversationExists: boolean, user: { _id: string, name: string }}>> => {
    if (!userId) {
      return Promise.reject(new Error('User ID is required'));
    }
    // Basic validation of userId format
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return Promise.reject(new Error('Invalid User ID format'));
    }
    return authenticatedRequest(`/api/messages/conversation/${userId}`) as unknown as Promise<ApiResponse<{conversationExists: boolean, user: { _id: string, name: string }}>>;
  },
  
  // Delete conversation with a user
  deleteConversation: (userId: string): Promise<ApiResponse<void>> => {
    if (!userId) {
      return Promise.reject(new Error('User ID is required'));
    }
    // Basic validation of userId format
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return Promise.reject(new Error('Invalid User ID format'));
    }
    return authenticatedRequest(`/api/messages/conversation/${userId}`, {
      method: 'DELETE',
    });
  },
  
  sendMessage: async (to: string, text: string): Promise<ApiResponse<Message>> => {
    if (!to || !text) {
      console.error('Validation failed: Recipient and message text are required');
      return Promise.reject(new Error('Recipient and message text are required'));
    }
    
    // Validate recipient ID
    if (typeof to !== 'string' || to.trim().length === 0) {
      console.error('Validation failed: Invalid recipient ID format');
      return Promise.reject(new Error('Invalid recipient ID format'));
    }
    
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      console.error('Validation failed: Message text cannot be empty');
      return Promise.reject(new Error('Message text cannot be empty'));
    }
    
    if (trimmedText.length > 1000) {
      console.error('Validation failed: Message text is too long (maximum 1000 characters)');
      return Promise.reject(new Error('Message text is too long (maximum 1000 characters)'));
    }

    // Prepare the request data
    const requestData = { to, text: trimmedText };

    try {
      const response = await authenticatedRequest<Message>('/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response) {
        console.error('No response received from server');
        return Promise.reject(new Error('No response received from server'));
      }

      if (!response.data) {
        console.error('Invalid response from server: missing data', response);
        return Promise.reject(new Error('Invalid response from server: missing data'));
      }

      // Check if response.data has the required properties
      if (!response.data._id || !response.data.text) {
        console.error('Invalid message format received from server', response.data);
        return Promise.reject(new Error('Invalid message format received from server'));
      }

      return response;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error instanceof Object ? Object.keys(error) : 'Not an object');
      return Promise.reject(new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  },

};

// Connection API
export const connectionApi = {
  // Send connection request
  sendRequest: async (recipientId: string, message?: string): Promise<ApiResponse<any>> => {
    try {
      const response = await authenticatedRequest('/api/connections/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId, message }),
      });
      return response;
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  },

  // Accept connection request
  acceptRequest: async (connectionId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await authenticatedRequest(`/api/connections/accept/${connectionId}`, {
        method: 'PUT',
      });
      return response;
    } catch (error) {
      console.error('Error accepting connection request:', error);
      throw error;
    }
  },

  // Decline connection request
  declineRequest: async (connectionId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await authenticatedRequest(`/api/connections/decline/${connectionId}`, {
        method: 'PUT',
      });
      return response;
    } catch (error) {
      console.error('Error declining connection request:', error);
      throw error;
    }
  },

  // Cancel connection request
  cancelRequest: async (connectionId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await authenticatedRequest(`/api/connections/cancel/${connectionId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Error cancelling connection request:', error);
      throw error;
    }
  },

  // Remove connection
  removeConnection: async (connectionId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await authenticatedRequest(`/api/connections/remove/${connectionId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  },

  // Get connection status with another user
  getConnectionStatus: async (userId: string): Promise<ApiResponse<{ status: string; connection: any }>> => {
    try {
      const response = await authenticatedRequest(`/api/connections/status/${userId}`);
      return response;
    } catch (error) {
      console.error('Error getting connection status:', error);
      throw error;
    }
  },

  // Get user's connections
  getUserConnections: async (userId?: string): Promise<ApiResponse<{ connections: any[]; total: number }>> => {
    try {
      const endpoint = userId ? `/api/connections/user/${userId}` : '/api/connections/user';
      const response = await authenticatedRequest(endpoint);
      return response;
    } catch (error) {
      console.error('Error getting user connections:', error);
      throw error;
    }
  },

  // Get connection requests
  getConnectionRequests: async (type: 'received' | 'sent' = 'received'): Promise<ApiResponse<{ requests: any[]; total: number }>> => {
    try {
      const response = await authenticatedRequest(`/api/connections/requests?type=${type}`);
      return response;
    } catch (error) {
      console.error('Error getting connection requests:', error);
      throw error;
    }
  },
};

// Job API interface
interface Job {
  _id: string;
  title: string;
  company: string;
  companyId?: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: string;
  };
  experience?: {
    min?: number;
    max?: number;
    required: boolean;
  };
  skills: string[];
  benefits: string[];
  author: string;
  applicants: {
    user: string;
    appliedAt: string;
    status: string;
  }[];
  status: string;
  deadline?: string;
  remote: boolean;
  postedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Company {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  logo?: string;
  location?: string;
  size?: string;
  founded?: number;
  createdBy: string;
  members: {
    user: string;
    role: string;
    joinedAt: string;
  }[];
  jobs: string[];
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const jobApi = {
  // Get all jobs with filters
  getJobs: (filters?: {
    type?: string;
    location?: string;
    search?: string;
    companyId?: string;
    sort?: string;
    page?: number;
    limit?: number;
    remote?: boolean;
    featured?: boolean;
    minSalary?: number;
    maxExperience?: number;
  }): Promise<ApiResponse<{ jobs: Job[]; pagination: Pagination }>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return authenticatedRequest(`/api/jobs${queryString}`);
  },
  
  // Get job by ID
  getJobById: (jobId: string): Promise<ApiResponse<Job>> => 
    authenticatedRequest(`/api/jobs/${jobId}`),
  
  // Create a new job
  createJob: (jobData: Partial<Job>): Promise<ApiResponse<Job>> => authenticatedRequest('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData),
  }),
  
  // Update a job
  updateJob: (jobId: string, jobData: Partial<Job>): Promise<ApiResponse<Job>> => 
    authenticatedRequest(`/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    }),
  
  // Delete a job
  deleteJob: (jobId: string): Promise<ApiResponse<void>> => 
    authenticatedRequest(`/api/jobs/${jobId}`, {
      method: 'DELETE',
    }),
  
  // Apply to a job
  applyToJob: (jobId: string): Promise<ApiResponse<{ job: Job; message: string }>> => 
    authenticatedRequest(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
    }),
  
  // Get jobs by company
  getCompanyJobs: (companyId: string): Promise<ApiResponse<Job[]>> => 
    authenticatedRequest(`/api/jobs/company/${companyId}`),
  
  // Get user's applications
  getUserApplications: (): Promise<ApiResponse<Job[]>> => 
    authenticatedRequest('/api/jobs/applications/my'),
    
  // Get jobs posted by current user
  getMyJobs: (): Promise<ApiResponse<Job[]>> => 
    authenticatedRequest('/api/jobs/my'),
    
  // Update application status (for employers)
  updateApplicationStatus: (jobId: string, userId: string, status: string): Promise<ApiResponse<{ job: Job; message: string }>> => 
    authenticatedRequest('/api/jobs/applications/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, userId, status }),
    }),
    
  // Save/Unsave a job
  saveJob: (jobId: string): Promise<ApiResponse<{ message: string; saved: boolean }>> => 
    authenticatedRequest(`/api/jobs/${jobId}/save`, {
      method: 'POST',
    }),
    
  // Get saved jobs
  getSavedJobs: (page: number = 1, limit: number = 20): Promise<ApiResponse<{ savedJobs: any[]; pagination: Pagination }>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return authenticatedRequest(`/api/jobs/saved?${params.toString()}`);
  },
  
  // Check if job is saved
  isJobSaved: (jobId: string): Promise<ApiResponse<{ saved: boolean }>> => 
    authenticatedRequest(`/api/jobs/${jobId}/saved`),
};

export const companyApi = {
  // Create a new company
  createCompany: (companyData: Partial<Company>): Promise<ApiResponse<Company>> => 
    authenticatedRequest('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData),
    }),
  
  // Get company by ID
  getCompanyById: (companyId: string): Promise<ApiResponse<Company>> => 
    authenticatedRequest(`/api/companies/${companyId}`),
  
  // Get public company profile (no auth required)
  getPublicCompanyProfile: async (companyId: string): Promise<ApiResponse<Company>> => {
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/public`);
    if (!response.ok) {
      throw new Error('Company not found');
    }
    return response.json();
  },
  
  // Get all companies with filters
  getCompanies: (filters?: {
    search?: string;
    industry?: string;
    location?: string;
    verified?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ companies: Company[]; pagination: Pagination }>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return authenticatedRequest(`/api/companies${queryString}`);
  },
  
  // Update a company
  updateCompany: (companyId: string, companyData: Partial<Company>): Promise<ApiResponse<Company>> => 
    authenticatedRequest(`/api/companies/${companyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData),
    }),
  
  // Delete a company
  deleteCompany: (companyId: string): Promise<ApiResponse<void>> => 
    authenticatedRequest(`/api/companies/${companyId}`, {
      method: 'DELETE',
    }),
  
  // Add a member to a company
  addCompanyMember: (companyId: string, userId: string, role?: string): Promise<ApiResponse<Company>> => 
    authenticatedRequest(`/api/companies/${companyId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    }),
  
  // Remove a member from a company
  removeCompanyMember: (companyId: string, userId: string): Promise<ApiResponse<Company>> => 
    authenticatedRequest(`/api/companies/${companyId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }),
  
  // Get user's companies
  getMyCompanies: (): Promise<ApiResponse<Company[]>> => 
    authenticatedRequest('/api/companies/my/companies'),
    
  // Get company stats
  getCompanyStats: (companyId: string): Promise<ApiResponse<{ jobCount: number; memberCount: number; applicationCount: number }>> => 
    authenticatedRequest(`/api/companies/${companyId}/stats`),
};

// Search API
export interface SearchResult {
  id: string;
  type: 'user' | 'company';
  name: string;
  headline: string;
  profileImage?: string;
  isVerified?: boolean;
}

export const searchApi = {
  search: (query: string, type?: 'users' | 'companies' | 'all'): Promise<ApiResponse<SearchResult[]>> => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (type) {
      params.append('type', type);
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return authenticatedRequest(`/api/search${queryString}`);
  },
};

// News API
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image?: string;
  publishedAt: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    isVerified: boolean;
  };
  timeAgo: string;
}

export const newsApi = {
  // Get all published news from all companies
  getAllNews: async (page: number = 1, limit: number = 10): Promise<ApiResponse<{ news: NewsArticle[]; pagination: Pagination }>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('_t', Date.now().toString()); // Cache busting parameter
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const url = `${API_BASE_URL}/api/news${queryString}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // The backend returns { news: [...], pagination: {...} } directly
      // But our ApiResponse interface expects { data: { news: [...], pagination: {...} } }
      // So we need to wrap it in a data property
      return {
        data: {
          news: data.news || [],
          pagination: data.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
        }
      };
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  },
  
  // Get single news article by ID
  getNewsById: async (id: string): Promise<ApiResponse<{ news: NewsArticle }>> => {
    const url = `${API_BASE_URL}/api/news/${id}?_t=${Date.now()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Wrap the response in the expected structure
      return {
        data: {
          news: data.news
        }
      };
    } catch (error) {
      console.error('Error fetching news article:', error);
      throw error;
    }
  },
  
  // Get news by company ID
  getCompanyNews: (companyId: string): Promise<ApiResponse<{ news: NewsArticle[] }>> => 
    authenticatedRequest(`/api/companies/${companyId}/news`),
};