// API Fallback Configuration for Frontend-Only Deployment
// This provides mock data when backend is not available

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';

// Check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Backend not available:', error);
    return false;
  }
};

// Mock data for when backend is not available
export const mockData = {
  user: {
    id: 'mock-user-1',
    name: 'Demo User',
    email: 'demo@cenopie.com',
    headline: 'Professional User',
    bio: 'This is a demo profile. Backend API is not connected.',
    profileImage: null,
    bannerImage: null,
    isVerified: false,
    followers: [],
    following: [],
    connections: 0,
    profileViews: 0,
  },
  
  posts: [
    {
      id: 'mock-post-1',
      content: 'Welcome to Cenopie! This is a demo post shown when the backend API is not connected.',
      author: {
        id: 'mock-user-1',
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
    }
  ],
  
  news: [
    {
      id: 'mock-news-1',
      title: 'Welcome to Cenopie',
      content: 'This is a demo news article. The backend API is not connected yet.',
      image: null,
      publishedAt: new Date().toISOString(),
      company: {
        id: 'mock-company-1',
        name: 'Cenopie Team',
        logo: null,
        isVerified: true,
      },
      timeAgo: 'Just now',
    }
  ],
  
  jobs: [
    {
      id: 'mock-job-1',
      title: 'Demo Job Position',
      company: {
        id: 'mock-company-1',
        name: 'Demo Company',
        logo: null,
        isVerified: false,
      },
      location: 'Remote',
      type: 'Full-time',
      description: 'This is a demo job posting. Backend API is not connected.',
      requirements: ['Demo requirement'],
      salary: 'Competitive',
      postedAt: new Date().toISOString(),
      applications: 0,
    }
  ],
  
  suggestedUsers: [
    {
      id: 'mock-suggested-1',
      name: 'Demo Connection',
      role: 'Demo Role',
      company: 'Demo Company',
      profileImage: null,
      isVerified: false,
    }
  ],
};

// Enhanced API wrapper with fallback
export const apiWithFallback = {
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`API call failed for ${endpoint}:`, error);
      
      // Return mock data based on endpoint
      if (endpoint.includes('/profile')) {
        return { data: { user: mockData.user } } as T;
      }
      if (endpoint.includes('/posts') || endpoint.includes('/feed')) {
        return { data: { posts: mockData.posts } } as T;
      }
      if (endpoint.includes('/news')) {
        return { data: { news: mockData.news } } as T;
      }
      if (endpoint.includes('/jobs')) {
        return { data: { jobs: mockData.jobs } } as T;
      }
      if (endpoint.includes('/users/suggested')) {
        return { data: { users: mockData.suggestedUsers } } as T;
      }
      
      // Default fallback
      throw error;
    }
  },
  
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for POST
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`API POST failed for ${endpoint}:`, error);
      
      // For authentication endpoints, show proper error
      if (endpoint.includes('/auth/')) {
        throw new Error('Authentication service is not available. Please try again later.');
      }
      
      throw error;
    }
  },
};

// Backend status hook
export const useBackendStatus = () => {
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const checkStatus = async () => {
      setIsChecking(true);
      const available = await checkBackendHealth();
      setIsBackendAvailable(available);
      setIsChecking(false);
    };
    
    checkStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { isBackendAvailable, isChecking };
};