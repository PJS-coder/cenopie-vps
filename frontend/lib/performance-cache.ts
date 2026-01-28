// Performance cache utilities for faster page loading

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Get cache size for debugging
  size(): number {
    return this.cache.size;
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const performanceCache = new PerformanceCache();

// Auto cleanup every 10 minutes
setInterval(() => {
  performanceCache.cleanup();
}, 10 * 60 * 1000);

// Cache keys for different data types
export const CACHE_KEYS = {
  JOBS: 'jobs',
  INTERVIEWS: 'interviews',
  SHOWCASE_USERS: 'showcase_users',
  SHOWCASE_POSTERS: 'showcase_posters',
  CONVERSATIONS: 'conversations',
  USER_PROFILE: 'user_profile',
  SAVED_JOBS: 'saved_jobs'
} as const;

// Helper function for API calls with caching
export async function cachedFetch<T>(
  url: string,
  cacheKey: string,
  options: RequestInit = {},
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  // Check cache first
  const cached = performanceCache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the result
  performanceCache.set(cacheKey, data, ttl);
  
  return data;
}

// Preload data for faster navigation
export function preloadData(key: string, fetchFn: () => Promise<any>, ttl?: number): void {
  // Only preload if not already cached
  if (!performanceCache.has(key)) {
    fetchFn()
      .then(data => performanceCache.set(key, data, ttl))
      .catch(error => console.warn(`Failed to preload ${key}:`, error));
  }
}

// Background refresh for stale data
export function backgroundRefresh<T>(
  key: string,
  fetchFn: () => Promise<T>,
  onUpdate?: (data: T) => void
): void {
  fetchFn()
    .then(data => {
      performanceCache.set(key, data);
      if (onUpdate) {
        onUpdate(data);
      }
    })
    .catch(error => console.warn(`Background refresh failed for ${key}:`, error));
}