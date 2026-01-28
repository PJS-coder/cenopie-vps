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
  
  // Load user profile immediately from localStorage (instant)
  useEffect(() => {
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
  }, []);
  
  // Load all data in parallel immediately
  const connections = useConnections();
  const feedData = useFeed({ filter });
  const suggestedUsers = useSuggestedUsers(true); // Load immediately
  const news = useNews(true); // Load immediately

  // Fetch fresh user data in background (non-blocking)
  const fetchCurrentUser = useCallback(async () => {
    if (userLoading) return; // Prevent multiple calls
    
    try {
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
        // Update localStorage for next time
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    } finally {
      setUserLoading(false);
    }
  }, [userLoading]);

  // Load fresh user data in background after initial render
  useEffect(() => {
    // Delay user profile fetch to not block initial render
    const timer = setTimeout(() => {
      fetchCurrentUser();
    }, 50);
    
    return () => clearTimeout(timer);
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