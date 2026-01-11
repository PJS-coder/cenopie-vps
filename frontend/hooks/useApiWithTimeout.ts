import { useState, useEffect, useCallback } from 'react';

interface UseApiWithTimeoutOptions {
  timeout?: number; // milliseconds
  retries?: number;
  fallbackData?: any;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isUsingFallback: boolean;
}

export function useApiWithTimeout<T>(
  apiCall: () => Promise<T>,
  options: UseApiWithTimeoutOptions = {}
) {
  const { timeout = 5000, retries = 1, fallbackData = null } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
    isUsingFallback: false,
  });

  const fetchWithTimeout = useCallback(async (attempt = 0): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });
      
      // Race between API call and timeout
      const result = await Promise.race([
        apiCall(),
        timeoutPromise
      ]);
      
      clearTimeout(timeoutId);
      
      setState({
        data: result,
        loading: false,
        error: null,
        isUsingFallback: false,
      });
      
    } catch (error) {
      console.warn(`API call failed (attempt ${attempt + 1}):`, error);
      
      if (attempt < retries) {
        // Retry after a short delay
        setTimeout(() => fetchWithTimeout(attempt + 1), 1000);
        return;
      }
      
      // All retries failed, use fallback if available
      if (fallbackData !== null) {
        setState({
          data: fallbackData,
          loading: false,
          error: null,
          isUsingFallback: true,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'API call failed',
          isUsingFallback: false,
        });
      }
    }
  }, [apiCall, timeout, retries, fallbackData]);

  useEffect(() => {
    fetchWithTimeout();
  }, [fetchWithTimeout]);

  const retry = useCallback(() => {
    fetchWithTimeout();
  }, [fetchWithTimeout]);

  return {
    ...state,
    retry,
  };
}

// Specific hook for profile data with fallback
export function useProfileWithFallback() {
  const mockProfile = {
    data: {
      user: {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@cenopie.com',
        headline: 'Demo Profile',
        bio: 'Backend API is not connected. This is demo data.',
        profileImage: null,
        bannerImage: null,
        isVerified: false,
        followers: [],
        following: [],
        experience: [],
        education: [],
        skills: [],
        profileViews: 0,
      }
    }
  };

  return useApiWithTimeout(
    async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    {
      timeout: 3000, // 3 seconds
      retries: 1,
      fallbackData: mockProfile,
    }
  );
}

// Hook for feed data with fallback
export function useFeedWithFallback() {
  const mockFeed = {
    data: {
      posts: [
        {
          id: 'demo-post-1',
          content: 'Welcome to Cenopie! This is demo content shown when the backend API is not available.',
          author: {
            id: 'demo-user',
            name: 'Demo User',
            profileImage: null,
            isVerified: false,
          },
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: [],
          reposts: 0,
          isLiked: false,
          isReposted: false,
          mediaUrl: null,
          mediaType: null,
        }
      ]
    }
  };

  return useApiWithTimeout(
    async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/posts/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    {
      timeout: 3000,
      retries: 1,
      fallbackData: mockFeed,
    }
  );
}

// Hook for news data with fallback
export function useNewsWithFallback() {
  const mockNews = {
    data: {
      news: [
        {
          id: 'demo-news-1',
          title: 'Welcome to Cenopie',
          content: 'This is demo news content. The backend API is not connected yet, but you can see how the news section will look.',
          image: null,
          publishedAt: new Date().toISOString(),
          company: {
            id: 'demo-company',
            name: 'Cenopie Team',
            logo: null,
            isVerified: true,
          },
          timeAgo: 'Just now',
        }
      ]
    }
  };

  return useApiWithTimeout(
    async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
      
      const response = await fetch(`${API_BASE_URL}/api/news`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    {
      timeout: 3000,
      retries: 1,
      fallbackData: mockNews,
    }
  );
}