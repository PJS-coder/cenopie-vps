import { useState, useEffect, useCallback } from 'react';
import { performanceCache, cachedFetch, backgroundRefresh } from '@/lib/performance-cache';

interface UseOptimizedLoadingOptions {
  cacheKey: string;
  cacheTTL?: number;
  timeout?: number;
  backgroundRefresh?: boolean;
  fallbackData?: any;
}

export function useOptimizedLoading<T>(
  fetchFn: () => Promise<T>,
  options: UseOptimizedLoadingOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    timeout = 5000, // 5 seconds
    backgroundRefresh: enableBackgroundRefresh = true,
    fallbackData = null
  } = options;

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Check cache first
      const cached = performanceCache.get<T>(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        
        // Background refresh if enabled
        if (enableBackgroundRefresh) {
          backgroundRefresh(cacheKey, fetchFn, setData);
        }
        return cached;
      }

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );

      // Race between fetch and timeout
      const result = await Promise.race([fetchFn(), timeoutPromise]);
      
      // Cache the result
      performanceCache.set(cacheKey, result, cacheTTL);
      setData(result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Try to use fallback data
      if (fallbackData) {
        setData(fallbackData);
      }
      
      console.error(`Error loading data for ${cacheKey}:`, err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, cacheKey, cacheTTL, timeout, enableBackgroundRefresh, fallbackData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    performanceCache.delete(cacheKey);
    return loadData(true);
  }, [cacheKey, loadData]);

  // Background refresh function
  const backgroundRefreshData = useCallback(() => {
    return loadData(false);
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    backgroundRefresh: backgroundRefreshData
  };
}

// Specialized hook for paginated data
export function useOptimizedPaginatedLoading<T>(
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: Omit<UseOptimizedLoadingOptions, 'cacheKey'> & { baseCacheKey: string }
) {
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { baseCacheKey, cacheTTL = 5 * 60 * 1000, timeout = 5000 } = options;

  const loadPage = useCallback(async (pageNum: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const cacheKey = `${baseCacheKey}_page_${pageNum}`;
      
      // Check cache first
      const cached = performanceCache.get<{ data: T[]; hasMore: boolean }>(cacheKey);
      if (cached) {
        if (isLoadMore) {
          setAllData(prev => [...prev, ...cached.data]);
        } else {
          setAllData(cached.data);
        }
        setHasMore(cached.hasMore);
        return cached;
      }

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );

      // Race between fetch and timeout
      const result = await Promise.race([fetchFn(pageNum), timeoutPromise]);
      
      // Cache the result
      performanceCache.set(cacheKey, result, cacheTTL);
      
      if (isLoadMore) {
        setAllData(prev => [...prev, ...result.data]);
      } else {
        setAllData(result.data);
      }
      setHasMore(result.hasMore);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`Error loading page ${pageNum} for ${baseCacheKey}:`, err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchFn, baseCacheKey, cacheTTL, timeout]);

  // Initial load
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      return loadPage(nextPage, true);
    }
  }, [loadPage, page, loadingMore, hasMore]);

  // Refresh function
  const refresh = useCallback(() => {
    // Clear all cached pages
    for (let i = 1; i <= page; i++) {
      performanceCache.delete(`${baseCacheKey}_page_${i}`);
    }
    setPage(1);
    setAllData([]);
    setHasMore(true);
    return loadPage(1);
  }, [baseCacheKey, page, loadPage]);

  return {
    data: allData,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh
  };
}