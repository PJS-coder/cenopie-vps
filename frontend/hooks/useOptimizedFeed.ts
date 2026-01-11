import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFeed } from './useFeed';
import { useSuggestedUsers } from './useSuggestedUsers';
import { useConnections } from './useConnections';
import { useNews } from './useNews';
import { profileApi } from '@/lib/api';
import { userCache } from '@/lib/performance';

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
  const [userLoading, setUserLoading] = useState(true);
  
  // Main feed data
  const feedData = useFeed({ filter });
  
  // Secondary data - load with delay to prioritize main content
  const [loadSecondary, setLoadSecondary] = useState(false);
  const suggestedUsers = useSuggestedUsers();
  const connections = useConnections();
  const news = useNews(5);

  // Load current user data with caching
  const fetchCurrentUser = useCallback(async () => {
    try {
      setUserLoading(true);
      
      // Check memory cache first
      const cachedUser = userCache.get('currentUser');
      if (cachedUser) {
        setCurrentUser(cachedUser);
        setUserLoading(false);
        return;
      }

      // Check localStorage cache
      const localCachedUser = localStorage.getItem('currentUserCache');
      const cacheTimestamp = localStorage.getItem('currentUserCacheTime');
      const now = Date.now();
      
      // Use localStorage cache if it's less than 5 minutes old
      if (localCachedUser && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 5 * 60 * 1000) {
        const parsedUser = JSON.parse(localCachedUser);
        setCurrentUser(parsedUser);
        userCache.set('currentUser', parsedUser, 5 * 60 * 1000); // Cache in memory too
        setUserLoading(false);
        return;
      }

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
        
        // Cache the user data in both memory and localStorage
        userCache.set('currentUser', transformedUser, 5 * 60 * 1000);
        localStorage.setItem('currentUserCache', JSON.stringify(transformedUser));
        localStorage.setItem('currentUserCacheTime', now.toString());
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
  }, [fetchCurrentUser]);

  // Load secondary data after a delay to prioritize main content
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadSecondary(true);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, []);

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