import { useEffect, useCallback } from 'react';
import { env } from '@/lib/config/env';

interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

interface WebVitalsMetric {
  name: 'CLS' | 'INP' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Performance thresholds based on Web Vitals
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

export const usePerformanceMonitor = () => {
  const reportMetric = useCallback((metric: PerformanceMetrics) => {
    // Log in development
    if (env.IS_DEVELOPMENT) {
      console.log(`🚀 Performance Metric: ${metric.name}`, {
        value: `${metric.value}ms`,
        rating: metric.rating,
        delta: metric.delta ? `${metric.delta}ms` : undefined,
      });
    }

    // Send to analytics in production
    if (env.IS_PRODUCTION && typeof window !== 'undefined') {
      // Google Analytics 4
      if ((window as any).gtag) {
        (window as any).gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.value),
          metric_rating: metric.rating,
        });
      }

      // Custom analytics endpoint
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          url: window.location.href,
          timestamp: Date.now(),
        });

        navigator.sendBeacon('/api/analytics/performance', data);
      }
    }
  }, []);

  const getRating = useCallback((name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
    if (!threshold) return 'good';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }, []);

  // Monitor Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamic import to avoid SSR issues
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      const handleMetric = (metric: WebVitalsMetric) => {
        reportMetric({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
        });
      };

      onCLS(handleMetric);
      onINP(handleMetric);
      onFCP(handleMetric);
      onLCP(handleMetric);
      onTTFB(handleMetric);
    }).catch((error) => {
      console.warn('Failed to load web-vitals:', error);
    });
  }, [reportMetric]);

  // Monitor custom metrics
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          // DOM Content Loaded
          const domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
          reportMetric({
            name: 'DOM_CONTENT_LOADED',
            value: domContentLoaded,
            rating: getRating('FCP', domContentLoaded),
          });

          // Page Load Time
          const pageLoadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          if (pageLoadTime > 0) {
            reportMetric({
              name: 'PAGE_LOAD_TIME',
              value: pageLoadTime,
              rating: getRating('LCP', pageLoadTime),
            });
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    return () => observer.disconnect();
  }, [reportMetric, getRating]);

  // Monitor resource loading
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Monitor slow resources
          if (resourceEntry.duration > 1000) {
            reportMetric({
              name: 'SLOW_RESOURCE',
              value: resourceEntry.duration,
              rating: 'poor',
            });
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource Performance Observer not supported:', error);
    }

    return () => observer.disconnect();
  }, [reportMetric]);

  // Monitor memory usage (if available)
  useEffect(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMemory = memory.usedJSHeapSize / 1048576; // Convert to MB
        const totalMemory = memory.totalJSHeapSize / 1048576;
        
        if (usedMemory > 50) { // Alert if using more than 50MB
          reportMetric({
            name: 'MEMORY_USAGE',
            value: usedMemory,
            rating: usedMemory > 100 ? 'poor' : 'needs-improvement',
          });
        }
      }
    };

    const interval = setInterval(checkMemory, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [reportMetric]);

  return {
    reportMetric,
    getRating,
  };
};