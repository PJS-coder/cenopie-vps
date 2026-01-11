'use client';

import React from 'react';

interface OptimizedLoaderProps {
  variant?: 'page' | 'component' | 'table' | 'feed';
  className?: string;
}

export default function OptimizedLoader({ variant = 'component', className = '' }: OptimizedLoaderProps) {
  if (variant === 'page') {
    return (
      <div className={`flex justify-center items-center min-h-screen ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#0BC0DF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return <TableSkeleton className={className} />;
  }

  if (variant === 'feed') {
    return <FeedSkeleton className={className} />;
  }

  // Default component variant
  return (
    <div className={`flex justify-center items-center py-8 ${className}`}>
      <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#0BC0DF] rounded-full animate-spin"></div>
    </div>
  );
}

// Table skeleton component
export function TableSkeleton({ className = '', rows = 5, columns = 4 }: { className?: string; rows?: number; columns?: number }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg p-6">
        <div className="space-y-4">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
              </div>
              {Array.from({ length: columns - 2 }, (_, j) => (
                <div key={j} className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Feed skeleton component
export function FeedSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full flex justify-center px-4 lg:px-6 pb-8 pt-6 ${className}`}>
      <div className="w-full lg:w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Sidebar Skeleton */}
          <div className="lg:col-span-1 order-1">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse"></div>
              <div className="p-5 pt-10">
                <div className="flex flex-col items-center text-center">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Feed Skeleton */}
          <div className="lg:col-span-3 order-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="lg:col-span-1 order-3 space-y-6 hidden lg:block">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse mb-3"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}