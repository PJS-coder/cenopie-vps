import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFeed } from './useFeed';
import { useSuggestedUsers } from './useSuggestedUsers';
import { useConnections } from './useConnections';
import { useNews } from './useNews';
import { profileApi } from '@/lib/api';

interface CurrentUser {
  id?: string;
  _id?: string;
  name?: string;
  role?: string;
  company?: string;
  college?: string;
  connections?: number;
  profileViews?: number;
  profileImage?: string;
  bannerImage?: string;
  headline?: string;
  bio?: string;
  followers?: string[];
  isVerified?: boolean;
}

export function useOptimizedFeed(filter: 'all' | 'following' = 'all') {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  
  // Priority 1: Load user profile immediately from localStorage (instant)
  // Priority 2: Load connections (fast - simple query)
  // Priority 3: Load feed posts in parallel with news and suggested users (slower)
  
  const connections = useConnections(); // Start loading connections immediately
  const feedData = useFeed({ filter }); // Start loading feed immediately
  
  // Delay loading of news and suggested users slightly to prioritize feed
  const [shouldLoadSecondary, setShouldLoadSecondary] = useState(false);
  
  useEffect(() => {
    // Wait 100ms before loading secondary data to prioritize feed
    const timer = setTimeout(() => {
      setShouldLoadSecondary(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const suggestedUsers = useSuggestedUsers(shouldLoadSecondary);
  const news = useNews(shouldLoadSecondary);

  // Load current user from localStorage first (instant), then fetch from API
  const fetchCurrentUser = useCallback(async () => {
    try {
      // Try localStorage first for instant load
      const cachedUser = localStorage.getItem('currentUser');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          const company = userData.experience?.find((exp: any) => exp.current)?.company || 
                         userData.experience?.[0]?.company;
          
          const college = userData.education?.find((edu: any) => edu.current)?.college || 
                         userData.education?.[0]?.college;
          
          const transformedUser: CurrentUser = {
            id: userData.id || userData._id,
            _id: userData._id || userData.id,
            name: userData.name,
            role: userData.headline || 'Professional',
            company: company,
            college: college,
            connections: userData.followers?.length || 0,
            profileViews: userData.profileViews || 0,
            profileImage: userData.profileImage,
            bannerImage: userData.bannerImage,
            headline: userData.headline,
            bio: userData.bio,
            followers: userData.followers,
            isVerified: userData.isVerified
          };
          
          setCurrentUser(transformedUser);
        } catch (e) {
          console.error('Error parsing cached user:', e);
        }
      }

      // Then fetch fresh data in background
      setUserLoading(true);
      const response = await profileApi.getProfile();
      const userData = response.data?.user || (response as any).user;
      
      if (userData) {
        const company = userData.experience?.find((exp: any) => exp.current)?.company || 
                       userData.experience?.[0]?.company;
        
        const college = userData.education?.find((edu: any) => edu.current)?.college || 
                       userData.education?.[0]?.college;
        
        const transformedUser: CurrentUser = {
          id: userData.id || userData._id,
          _id: userData._id || userData.id,
          name: userData.name,
          role: userData.headline || 'Professional',
          company: company,
          college: college,
          connections: userData.followers?.length || 0,
          profileViews: userData.profileViews || 0,
          profileImage: userData.profileImage,
          bannerImage: userData.bannerImage,
          headline: userData.headline,
          bio: userData.bio,
          followers: userData.followers,
          isVerified: userData.isVerified
        };
        
        setCurrentUser(transformedUser);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Load user data immediately
  useEffect(() => {
    fetchCurrentUser();
    
    // Listen for profile updates and refetch immediately
    const handleProfileUpdate = () => {
      fetchCurrentUser();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [fetchCurrentUser]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // Main feed data
    ...feedData,
    
    // User data
    currentUser,
    userLoading,
    
    // Secondary data
    suggestedUsers: suggestedUsers.users,
    suggestedUsersLoading: suggestedUsers.loading,
    suggestedUsersError: suggestedUsers.error,
    
    connections: connections.connections,
    connectionsLoading: connections.loading,
    
    news: news.news,
    newsLoading: news.loading,
    newsError: news.error,
    refreshNews: news.refreshNews,
    
    // Helper functions
    getUserInitials: (name: string) => {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2);
    },
    
    isPostSaved: (postId: string): boolean => {
      try {
        const savedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
        return savedPosts.some((savedPost: any) => savedPost.id === postId);
      } catch (error) {
        console.error('Error checking if post is saved:', error);
        return false;
      }
    }
  }), [
    feedData,
    currentUser,
    userLoading,
    suggestedUsers,
    connections,
    news
  ]);
}