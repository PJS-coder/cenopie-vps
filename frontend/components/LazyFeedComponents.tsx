'use client';

import React, { lazy, Suspense } from 'react';

// Lazy load heavy components
const PostCard = lazy(() => import('@/components/PostCard'));
const CustomVideoPlayer = lazy(() => import('@/components/CustomVideoPlayer'));

// Loading fallbacks
export function PostCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VideoPlayerSkeleton() {
  return (
    <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
      <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
        <div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
      </div>
    </div>
  );
}

// Lazy wrapped components
export function LazyPostCard(props: any) {
  return (
    <Suspense fallback={<PostCardSkeleton />}>
      <PostCard {...props} />
    </Suspense>
  );
}

export function LazyCustomVideoPlayer(props: any) {
  return (
    <Suspense fallback={<VideoPlayerSkeleton />}>
      <CustomVideoPlayer {...props} />
    </Suspense>
  );
}