import { QueryClient } from '@tanstack/react-query';

// Cache configuration based on data type
const CACHE_CONFIG = {
  // Fast-changing data
  feed: { staleTime: 2 * 60 * 1000, gcTime: 5 * 60 * 1000 }, // 2min stale, 5min cache
  notifications: { staleTime: 1 * 60 * 1000, gcTime: 3 * 60 * 1000 }, // 1min stale, 3min cache
  
  // Medium-changing data
  profile: { staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 }, // 10min stale, 30min cache
  connections: { staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000 }, // 5min stale, 15min cache
  
  // Slow-changing data
  news: { staleTime: 15 * 60 * 1000, gcTime: 60 * 60 * 1000 }, // 15min stale, 1hr cache
  companies: { staleTime: 30 * 60 * 1000, gcTime: 2 * 60 * 60 * 1000 }, // 30min stale, 2hr cache
  
  // Static-like data
  suggested: { staleTime: 60 * 60 * 1000, gcTime: 4 * 60 * 60 * 1000 }, // 1hr stale, 4hr cache
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_CONFIG.feed.staleTime, // Default to feed timing
      gcTime: CACHE_CONFIG.feed.gcTime,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always', // Always refetch on reconnect
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('4') && !message.includes('429')) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});

// Helper function to get cache config for specific data types
export const getCacheConfig = (type: keyof typeof CACHE_CONFIG) => CACHE_CONFIG[type];

// Prefetch critical data
export const prefetchCriticalData = async () => {
  // Prefetch user profile and connections in parallel
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['profile'],
      queryFn: async () => {
        // Return mock data for now
        return { user: null };
      },
      ...CACHE_CONFIG.profile,
    }),
    queryClient.prefetchQuery({
      queryKey: ['connections'],
      queryFn: async () => {
        // Return mock data for now
        return { connections: [] };
      },
      ...CACHE_CONFIG.connections,
    }),
  ]);
};
