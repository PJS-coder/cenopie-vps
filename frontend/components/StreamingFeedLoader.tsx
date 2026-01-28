'use client';

import { memo } from 'react';

interface StreamingFeedLoaderProps {
  count?: number;
}

const PostSkeleton = memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    {/* Header */}
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      </div>
    </div>
    
    {/* Content */}
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    </div>
    
    {/* Actions */}
    <div className="flex items-center space-x-6 pt-4 border-t border-gray-100 dark:border-gray-700">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
    </div>
  </div>
));

PostSkeleton.displayName = 'PostSkeleton';

export default function StreamingFeedLoader({ count = 3 }: StreamingFeedLoaderProps) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }, (_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}