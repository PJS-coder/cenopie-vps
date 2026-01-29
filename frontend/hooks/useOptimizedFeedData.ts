import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCacheConfig } from '@/lib/queryClient';

interface FeedOptions {
  filter?: 'all' | 'following';
  limit?: number;
  prefetchSecondary?: boolean;
}

// Simplified version that works with existing API structure
export function useOptimizedFeedData({ 
  filter = 'all', 
  limit = 10,
  prefetchSecondary = true 
}: FeedOptions = {}) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load user from localStorage immediately (synchronous)
  useEffect(() => {
    const cachedUser = localStorage.getItem('currentUser');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch (error) {
        console.warn('Failed to parse cached user:', error);
      }
    }
  }, []);

  // Simplified queries that work with existing API
  const feedQuery = useQuery({
    queryKey: ['feed', filter, limit],
    queryFn: async () => {
      // Return mock data for now until API is properly integrated
      return {
        posts: [],
        hasMore: false,
        total: 0
      };
    },
    ...getCacheConfig('feed'),
    enabled: true,
    refetchOnMount: false,
  });

  // Memoized results to prevent unnecessary re-renders
  const result = useMemo(() => ({
    // Feed data
    posts: feedQuery.data?.posts || [],
    feedLoading: feedQuery.isLoading,
    feedError: feedQuery.error,
    hasMore: feedQuery.data?.hasMore || false,
    
    // Secondary data (simplified)
    connections: [],
    connectionsLoading: false,
    news: [],
    newsLoading: false,
    suggestedUsers: [],
    suggestedUsersLoading: false,
    
    // User data
    currentUser,
    
    // Loading states
    isInitialLoading: feedQuery.isLoading && !feedQuery.data,
    isAnyLoading: feedQuery.isLoading,
    
    // Actions
    refetchFeed: feedQuery.refetch,
    refetchAll: () => Promise.resolve(),
    
    // Cache management
    invalidateCache: (keys?: string[]) => {
      if (keys) {
        keys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
      } else {
        queryClient.invalidateQueries();
      }
    },
  }), [
    feedQuery.data, feedQuery.isLoading, feedQuery.error, feedQuery.refetch,
    currentUser,
    queryClient
  ]);

  // Load more posts (simplified)
  const loadMore = useCallback(async () => {
    if (!result.hasMore || result.feedLoading) return;
    
    try {
      // TODO: Implement proper pagination
      console.log('Loading more posts...');
    } catch (error) {
      console.error('Failed to load more posts:', error);
    }
  }, [result.hasMore, result.feedLoading]);

  return {
    ...result,
    loadMore,
  };
}