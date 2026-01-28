// Performance utilities for measuring and optimizing app performance

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, number> = new Map();
  private timers: Map<string, number> = new Map();

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  // Start timing an operation
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  // End timing and record the metric
  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(name, duration);
    this.timers.delete(name);

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Get all recorded metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  // Measure a function execution time
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  // Report Core Web Vitals
  reportWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('🎨 LCP:', lastEntry.startTime.toFixed(2) + 'ms');
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as any;
        if (fidEntry.processingStart) {
          console.log('⚡ FID:', (fidEntry.processingStart - entry.startTime).toFixed(2) + 'ms');
        }
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const clsEntry = entry as any;
        if (!clsEntry.hadRecentInput && clsEntry.value) {
          clsValue += clsEntry.value;
        }
      });
      console.log('📐 CLS:', clsValue.toFixed(4));
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

// Singleton instance
export const performanceTracker = PerformanceTracker.getInstance();

// Hook for measuring component render times
export function usePerformanceTracker(componentName: string) {
  const tracker = PerformanceTracker.getInstance();
  
  return {
    startRender: () => tracker.startTimer(`${componentName}-render`),
    endRender: () => tracker.endTimer(`${componentName}-render`),
    measureAsync: <T>(name: string, fn: () => Promise<T>) => 
      tracker.measure(`${componentName}-${name}`, fn),
  };
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Memory usage monitoring
export function monitorMemoryUsage(): void {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  const memory = (performance as any).memory;
  console.log('💾 Memory Usage:', {
    'Used': (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
    'Total': (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
    'Limit': (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB',
  });
}