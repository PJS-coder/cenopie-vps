'use client';

import React from 'react';
import { useNavigationLoading } from '@/hooks/useLoadingState';

export default function GlobalLoadingIndicator() {
  const isNavigating = useNavigationLoading();

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div className="h-full bg-gradient-to-r from-[#0CC0DF] to-blue-500 animate-pulse"></div>
      </div>
    </div>
  );
}

// Alternative progress bar style
export function ProgressLoadingIndicator() {
  const isNavigating = useNavigationLoading();

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#0CC0DF] to-blue-500 transition-all duration-300 ease-out"
          style={{
            width: '100%',
            animation: 'loading-progress 2s ease-in-out infinite'
          }}
        />
      </div>
      <style jsx>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}