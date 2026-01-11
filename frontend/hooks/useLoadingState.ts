'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LoadingStateOptions {
  minLoadingTime?: number; // Minimum time to show loading (prevents flash)
  showLoadingAfter?: number; // Delay before showing loading (prevents flash for fast operations)
}

export function useLoadingState(options: LoadingStateOptions = {}) {
  const { minLoadingTime = 300, showLoadingAfter = 100 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShowLoading, setShouldShowLoading] = useState(false);

  const startLoading = () => {
    setIsLoading(true);
    
    // Delay showing loading indicator to prevent flash for fast operations
    const showTimer = setTimeout(() => {
      setShouldShowLoading(true);
    }, showLoadingAfter);

    return () => clearTimeout(showTimer);
  };

  const stopLoading = () => {
    setIsLoading(false);
    
    // Ensure minimum loading time to prevent jarring experience
    setTimeout(() => {
      setShouldShowLoading(false);
    }, minLoadingTime);
  };

  return {
    isLoading,
    shouldShowLoading,
    startLoading,
    stopLoading,
  };
}

// Hook for navigation loading states
export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => {
      setTimeout(() => setIsNavigating(false), 100); // Small delay for smooth transition
    };

    // Listen for route changes
    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (...args: Parameters<typeof originalPush>) => {
      handleStart();
      const result = originalPush.apply(router, args);
      // Handle completion after navigation
      Promise.resolve(result).then(handleComplete).catch(handleComplete);
      return result;
    };

    router.replace = (...args: Parameters<typeof originalReplace>) => {
      handleStart();
      const result = originalReplace.apply(router, args);
      // Handle completion after navigation
      Promise.resolve(result).then(handleComplete).catch(handleComplete);
      return result;
    };

    return () => {
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  return isNavigating;
}

// Hook for API loading states
export function useApiLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  };

  const isLoading = (key: string) => loadingStates[key] || false;
  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates,
  };
}