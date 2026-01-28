import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function LoadingSkeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  lines = 1
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  
  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} h-4 rounded`}
            style={{
              width: index === lines - 1 ? '75%' : '100%',
              ...(width && { width }),
              ...(height && { height })
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{
          width: width || '40px',
          height: height || '40px'
        }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${className} bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700`}>
        <div className="flex items-start gap-4">
          <LoadingSkeleton variant="circular" width="48px" height="48px" />
          <div className="flex-1">
            <LoadingSkeleton variant="text" lines={1} className="mb-2" />
            <LoadingSkeleton variant="text" lines={2} />
            <div className="flex gap-2 mt-3">
              <LoadingSkeleton width="60px" height="24px" className="rounded-full" />
              <LoadingSkeleton width="80px" height="24px" className="rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} rounded ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px'
      }}
    />
  );
}

// Specialized skeleton components
export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-start gap-3 mb-3">
        <LoadingSkeleton variant="circular" width="40px" height="40px" />
        <div className="flex-1">
          <LoadingSkeleton variant="text" lines={1} className="mb-1" />
          <LoadingSkeleton variant="text" lines={1} width="60%" />
        </div>
      </div>
      <LoadingSkeleton variant="text" lines={2} className="mb-3" />
      <div className="flex gap-2 mb-3">
        <LoadingSkeleton width="60px" height="24px" className="rounded-full" />
        <LoadingSkeleton width="80px" height="24px" className="rounded-full" />
      </div>
      <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
        <LoadingSkeleton variant="text" lines={2} width="40%" />
        <LoadingSkeleton width="60px" height="32px" className="rounded-lg" />
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700">
      <LoadingSkeleton variant="circular" width="48px" height="48px" />
      <div className="flex-1">
        <LoadingSkeleton variant="text" lines={1} className="mb-1" />
        <LoadingSkeleton variant="text" lines={1} width="70%" />
      </div>
      <LoadingSkeleton width="40px" height="16px" />
    </div>
  );
}

export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex gap-2 mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && <LoadingSkeleton variant="circular" width="32px" height="32px" />}
      <div className={`max-w-xs ${isOwn ? 'bg-blue-500' : 'bg-gray-200'} rounded-lg p-3`}>
        <LoadingSkeleton 
          variant="text" 
          lines={Math.floor(Math.random() * 3) + 1}
          className={isOwn ? 'bg-blue-400' : 'bg-gray-300'}
        />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-4">
        <LoadingSkeleton variant="circular" width="64px" height="64px" />
        <div className="flex-1">
          <LoadingSkeleton variant="text" lines={1} className="mb-2" />
          <LoadingSkeleton variant="text" lines={3} className="mb-4" />
          <div className="flex gap-4">
            <LoadingSkeleton width="80px" height="20px" />
            <LoadingSkeleton width="60px" height="20px" />
            <LoadingSkeleton width="70px" height="20px" />
          </div>
        </div>
        <div className="flex gap-2">
          <LoadingSkeleton width="80px" height="36px" className="rounded-lg" />
          <LoadingSkeleton width="60px" height="36px" className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Banner Section Skeleton */}
      <div className="relative h-56">
        <div className="w-full h-full bg-gray-200 animate-pulse"></div>
        
        {/* Profile Image Skeleton */}
        <div className="absolute -bottom-20 left-8 z-30">
          <div className="w-40 h-40 bg-gray-200 rounded-full border-4 border-white shadow-2xl animate-pulse"></div>
        </div>
      </div>
      
      {/* Profile Info Section Skeleton */}
      <div className="px-8 pt-24 pb-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <LoadingSkeleton width="256px" height="32px" />
              <LoadingSkeleton variant="circular" width="24px" height="24px" />
            </div>
            <LoadingSkeleton width="320px" height="24px" className="mb-4" />
            <div className="flex gap-4">
              <LoadingSkeleton width="128px" height="32px" className="rounded-full" />
              <LoadingSkeleton width="160px" height="32px" className="rounded-full" />
            </div>
          </div>
          <LoadingSkeleton width="128px" height="40px" className="rounded-lg" />
        </div>
        
        {/* Bio Section Skeleton */}
        <div className="mt-6 bg-gray-100 p-6 rounded-2xl">
          <LoadingSkeleton variant="text" lines={3} />
        </div>
      </div>
    </div>
  );
}