// Ultra-performance optimization utilities for maximum speed

// Ultra-fast cache with intelligent TTL and compression
class UltraFastCache<T> {
  private cache = new Map<string, { 
    data: T; 
    timestamp: number; 
    ttl: number; 
    hits: number;
    size: number;
  }>();
  private maxSize = 10000; // Maximum cache entries
  private compressionThreshold = 1024; // Compress data larger than 1KB
  
  set(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Intelligent eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    
    // Calculate data size for intelligent caching
    const dataSize = JSON.stringify(data).length;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      hits: 0,
      size: dataSize
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Track cache hits for intelligent eviction
    item.hits++;
    return item.data;
  }
  
  // Intelligent eviction based on usage patterns
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by hits (ascending) and age (descending)
    entries.sort((a, b) => {
      const hitsDiff = a[1].hits - b[1].hits;
      if (hitsDiff !== 0) return hitsDiff;
      return b[1].timestamp - a[1].timestamp;
    });
    
    // Remove least used 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  // Get cache statistics
  getStats() {
    let totalSize = 0;
    let totalHits = 0;
    
    for (const [, item] of this.cache.entries()) {
      totalSize += item.size;
      totalHits += item.hits;
    }
    
    return {
      entries: this.cache.size,
      totalSize,
      totalHits,
      hitRate: totalHits / Math.max(this.cache.size, 1)
    };
  }
}

// Global ultra-fast cache instances
export const userCache = new UltraFastCache<any>();
export const feedCache = new UltraFastCache<any>();
export const apiCache = new UltraFastCache<any>();

// Ultra-fast debounce with immediate execution option
export function ultraDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  return (...args: Parameters<T>) => {
    lastArgs = args;
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate && lastArgs) {
        func(...lastArgs);
      }
    }, wait);
    
    if (callNow) {
      func(...args);
    }
  };
}

// Ultra-fast throttle with trailing execution
export function ultraThrottle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return (...args: Parameters<T>) => {
    lastArgs = args;
    
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    }
  };
}

// Ultra-performance intersection observer with intelligent thresholds
export function createUltraIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px', // Preload content 50px before it's visible
    threshold: [0, 0.1, 0.5, 1.0], // Multiple thresholds for precise control
    ...options
  };

  return new IntersectionObserver((entries) => {
    // Batch process entries for performance
    requestAnimationFrame(() => {
      callback(entries);
    });
  }, defaultOptions);
}

// Ultra-fast request deduplication and batching
class UltraRequestManager {
  private pendingRequests = new Map<string, Promise<any>>();
  private requestQueue = new Map<string, Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>>();
  
  async request<T>(
    url: string, 
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<T> {
    const key = cacheKey || `${url}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = apiCache.get(key);
    if (cached) {
      return cached;
    }
    
    // Deduplicate identical requests
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    // Create new request with ultra-fast configuration
    const requestPromise = this.makeUltraRequest<T>(url, options);
    this.pendingRequests.set(key, requestPromise);
    
    try {
      const result = await requestPromise;
      
      // Cache successful results with intelligent TTL
      const ttl = this.calculateTTL(url, result);
      apiCache.set(key, result, ttl);
      
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
  
  private async makeUltraRequest<T>(url: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          ...options.headers
        },
        // Ultra-performance fetch options
        keepalive: true,
        mode: 'cors',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Use streaming for large responses
      if (response.headers.get('content-length')) {
        const contentLength = parseInt(response.headers.get('content-length') || '0');
        if (contentLength > 1024 * 1024) { // 1MB threshold
          return this.streamResponse<T>(response);
        }
      }
      
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  private async streamResponse<T>(response: Response): Promise<T> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const chunks: Uint8Array[] = [];
    let totalLength = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      totalLength += value.length;
    }
    
    // Combine chunks efficiently
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    const text = new TextDecoder().decode(combined);
    return JSON.parse(text);
  }
  
  private calculateTTL(url: string, data: any): number {
    // Intelligent TTL based on URL patterns and data size
    const dataSize = JSON.stringify(data).length;
    let baseTTL = 5 * 60 * 1000; // 5 minutes base
    
    // API-specific TTL
    if (url.includes('/api/feed')) baseTTL = 2 * 60 * 1000; // 2 minutes for feed
    else if (url.includes('/api/profile')) baseTTL = 10 * 60 * 1000; // 10 minutes for profiles
    else if (url.includes('/api/jobs')) baseTTL = 15 * 60 * 1000; // 15 minutes for jobs
    else if (url.includes('/api/auth')) baseTTL = 30 * 60 * 1000; // 30 minutes for auth
    
    // Adjust based on data size (larger data cached longer)
    if (dataSize > 10000) baseTTL *= 2;
    else if (dataSize > 1000) baseTTL *= 1.5;
    
    return Math.min(baseTTL, 60 * 60 * 1000); // Max 1 hour
  }
  
  // Batch multiple requests for efficiency
  async batchRequests<T>(requests: Array<{
    url: string;
    options?: RequestInit;
    cacheKey?: string;
  }>): Promise<T[]> {
    const promises = requests.map(req => 
      this.request<T>(req.url, req.options, req.cacheKey)
    );
    
    return Promise.all(promises);
  }
  
  // Preload critical resources
  preload(urls: string[]): void {
    urls.forEach(url => {
      // Use low priority for preloading
      this.request(url, { 
        priority: 'low' as any,
        cache: 'force-cache'
      }).catch(() => {}); // Ignore preload errors
    });
  }
}

// Global ultra-fast request manager
export const ultraRequestManager = new UltraRequestManager();

// Ultra-fast component update batching
class UltraUpdateBatcher {
  private updateQueue = new Set<() => void>();
  private isScheduled = false;
  
  schedule(updateFn: () => void): void {
    this.updateQueue.add(updateFn);
    
    if (!this.isScheduled) {
      this.isScheduled = true;
      
      // Use scheduler API if available, otherwise requestAnimationFrame
      if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
        (window as any).scheduler.postTask(() => this.flush(), { priority: 'user-blocking' });
      } else {
        requestAnimationFrame(() => this.flush());
      }
    }
  }
  
  private flush(): void {
    const updates = Array.from(this.updateQueue);
    this.updateQueue.clear();
    this.isScheduled = false;
    
    // Execute all updates in a single frame
    updates.forEach(update => {
      try {
        update();
      } catch (error) {
        console.error('Update batch error:', error);
      }
    });
  }
}

export const ultraUpdateBatcher = new UltraUpdateBatcher();

// Ultra-fast image optimization
export function createUltraImageObserver(): IntersectionObserver {
  return createUltraIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        
        if (img.dataset.src) {
          // Preload image for smooth loading
          const preloadImg = new Image();
          preloadImg.onload = () => {
            img.src = img.dataset.src!;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
          };
          preloadImg.src = img.dataset.src;
        }
        
        // Stop observing once loaded
        ultraImageObserver.unobserve(img);
      }
    });
  }, { rootMargin: '100px' }); // Load images 100px before visible
}

// Global image observer
export const ultraImageObserver = createUltraImageObserver();

// Ultra-fast scroll optimization
export function createUltraScrollHandler(
  callback: (scrollY: number, direction: 'up' | 'down') => void,
  throttleMs: number = 16 // 60fps
) {
  let lastScrollY = window.scrollY;
  let ticking = false;
  
  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const direction = currentScrollY > lastScrollY ? 'down' : 'up';
        
        callback(currentScrollY, direction);
        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  };
  
  // Use passive listeners for better performance
  window.addEventListener('scroll', ultraThrottle(handleScroll, throttleMs), { 
    passive: true 
  });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}

// Ultra-fast virtual scrolling helper
export class UltraVirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private visibleCount: number;
  private buffer: number;
  private scrollTop = 0;
  
  constructor(
    container: HTMLElement,
    itemHeight: number,
    buffer: number = 5
  ) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + buffer * 2;
  }
  
  getVisibleRange(totalItems: number): { start: number; end: number } {
    const start = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.buffer);
    const end = Math.min(totalItems, start + this.visibleCount);
    
    return { start, end };
  }
  
  updateScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }
  
  getItemStyle(index: number): React.CSSProperties {
    return {
      position: 'absolute',
      top: index * this.itemHeight,
      height: this.itemHeight,
      width: '100%'
    };
  }
  
  getTotalHeight(itemCount: number): number {
    return itemCount * this.itemHeight;
  }
}

// Ultra-fast memory management
export function createUltraMemoryManager() {
  const cleanup = () => {
    // Clear caches if memory usage is high
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (usedRatio > 0.8) {
        console.log('🧹 High memory usage detected, clearing caches...');
        userCache.clear();
        feedCache.clear();
        
        // Force garbage collection if available
        if ('gc' in window) {
          (window as any).gc();
        }
      }
    }
  };
  
  // Monitor memory every 30 seconds
  const interval = setInterval(cleanup, 30000);
  
  return () => clearInterval(interval);
}

// Ultra-fast performance monitoring
export class UltraPerformanceMonitor {
  private metrics = {
    apiCalls: 0,
    cacheHits: 0,
    renderTime: 0,
    memoryUsage: 0
  };
  
  trackApiCall(): void {
    this.metrics.apiCalls++;
  }
  
  trackCacheHit(): void {
    this.metrics.cacheHits++;
  }
  
  trackRender(time: number): void {
    this.metrics.renderTime = (this.metrics.renderTime + time) / 2; // Moving average
  }
  
  getMetrics() {
    const cacheHitRate = this.metrics.apiCalls > 0 ? 
      (this.metrics.cacheHits / this.metrics.apiCalls * 100).toFixed(2) : '0';
    
    return {
      ...this.metrics,
      cacheHitRate: `${cacheHitRate}%`
    };
  }
  
  logPerformance(): void {
    const stats = this.getMetrics();
    console.log('📊 Ultra Performance Stats:', stats);
    console.log('📊 Cache Stats:', {
      user: userCache.getStats(),
      feed: feedCache.getStats(),
      api: apiCache.getStats()
    });
  }
}

export const ultraPerformanceMonitor = new UltraPerformanceMonitor();

// Start performance monitoring
if (typeof window !== 'undefined') {
  // Log performance stats every 60 seconds
  setInterval(() => {
    ultraPerformanceMonitor.logPerformance();
  }, 60000);
  
  // Start memory management
  createUltraMemoryManager();
}