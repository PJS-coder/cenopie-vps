'use client';

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('🚀 Navigation Timing:', {
            'DNS Lookup': navEntry.domainLookupEnd - navEntry.domainLookupStart,
            'TCP Connection': navEntry.connectEnd - navEntry.connectStart,
            'Request': navEntry.responseStart - navEntry.requestStart,
            'Response': navEntry.responseEnd - navEntry.responseStart,
            'DOM Processing': navEntry.domContentLoadedEventEnd - navEntry.responseEnd,
            'Total Load Time': navEntry.loadEventEnd - navEntry.fetchStart,
          });
        }

        if (entry.entryType === 'largest-contentful-paint') {
          console.log('🎨 LCP:', entry.startTime.toFixed(2) + 'ms');
        }

        if (entry.entryType === 'first-input') {
          const fidEntry = entry as any;
          console.log('⚡ FID:', (fidEntry.processingStart - entry.startTime).toFixed(2) + 'ms');
        }

        if (entry.entryType === 'layout-shift') {
          const clsEntry = entry as any;
          console.log('📐 CLS:', clsEntry.value?.toFixed(4) || '0');
        }
      });
    });

    // Observe different entry types
    try {
      observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Fallback for browsers that don't support all entry types
      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (fallbackError) {
        console.warn('Performance monitoring not supported in this browser');
      }
    }

    // Monitor bundle size
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        console.log('📶 Network:', {
          'Effective Type': connection.effectiveType || 'unknown',
          'Downlink': (connection.downlink || 0) + ' Mbps',
          'RTT': (connection.rtt || 0) + 'ms',
        });
      }
    }

    return () => observer.disconnect();
  }, []);

  return null;
}