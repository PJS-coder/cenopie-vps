'use client';

import { useState, useEffect } from 'react';

interface ProgressLoaderProps {
  isLoading: boolean;
  progress?: number;
}

export default function ProgressLoader({ isLoading, progress }: ProgressLoaderProps) {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentProgress(100);
      return;
    }

    if (progress !== undefined) {
      setCurrentProgress(progress);
      return;
    }

    // Auto-increment progress for perceived performance
    const interval = setInterval(() => {
      setCurrentProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isLoading, progress]);

  if (!isLoading && currentProgress === 100) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-700">
      <div 
        className="h-full bg-gradient-to-r from-[#0BC0DF] to-cyan-400 transition-all duration-300 ease-out"
        style={{ width: `${currentProgress}%` }}
      />
    </div>
  );
}