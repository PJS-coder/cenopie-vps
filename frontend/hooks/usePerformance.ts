import { useEffect, useRef, useState, useCallback } from 'react';

// Hook for optimized intersection observer
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [hasIntersected, options]);

  return { targetRef, isIntersecting, hasIntersected };
}

// Hook for debounced loading states
export function useDebouncedLoading(loading: boolean, delay: number = 300) {
  const [debouncedLoading, setDebouncedLoading] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setDebouncedLoading(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setDebouncedLoading(false);
    }
  }, [loading, delay]);

  return debouncedLoading;
}

// Hook for optimized image loading
export function useOptimizedImage(src: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoaded, hasError };
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<{
    loadTime?: number;
    renderTime?: number;
  }>({});

  // Initialize refs with proper initial values
  const startTime = useRef<number | undefined>(undefined);
  const renderStartTime = useRef<number | undefined>(undefined);

  const startTimer = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endTimer = useCallback(() => {
    if (startTime.current) {
      const loadTime = performance.now() - startTime.current;
      setMetrics(prev => ({ ...prev, loadTime }));
    }
  }, []);

  const startRenderTimer = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderTimer = useCallback(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({ ...prev, renderTime }));
    }
  }, []);

  return {
    metrics,
    startTimer,
    endTimer,
    startRenderTimer,
    endRenderTimer,
  };
}

// Hook for optimized scroll handling
export function useOptimizedScroll(callback: () => void, threshold: number = 100) {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        
        const isNear = scrollTop + clientHeight >= scrollHeight - threshold;
        
        if (isNear && !isNearBottom) {
          setIsNearBottom(true);
          callback();
        } else if (!isNear && isNearBottom) {
          setIsNearBottom(false);
        }
        
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, [callback, threshold, isNearBottom]);

  useEffect(() => {
    const scrollHandler = (event: Event) => handleScroll();
    window.addEventListener('scroll', scrollHandler, { passive: true });
    return () => window.removeEventListener('scroll', scrollHandler);
  }, [handleScroll]);

  return isNearBottom;
}
