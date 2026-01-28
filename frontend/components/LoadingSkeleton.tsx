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
              ...(height && { height }),
              animationDuration: '1s' // Faster animation
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
          height: height || '40px',
          animationDuration: '1s' // Faster animation
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
        height: height || '20px',
        animationDuration: '1s' // Faster animation
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

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      <div className="relative w-full flex justify-center px-4 py-8">
        <div className="w-full max-w-[1200px]">
          <div className="flex gap-8">
            
            {/* Main Content Area */}
            <div className="flex-1 space-y-6">
              
              {/* Profile Header Card Skeleton */}
              <ProfileHeaderSkeleton />

              {/* Stats Cards Skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
                    <div className="flex items-center gap-3">
                      <LoadingSkeleton variant="circular" width="48px" height="48px" className="rounded-xl" />
                      <div>
                        <LoadingSkeleton width="48px" height="24px" className="mb-1" />
                        <LoadingSkeleton width="80px" height="12px" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* About Section Skeleton */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <LoadingSkeleton variant="circular" width="40px" height="40px" className="rounded-xl" />
                  <LoadingSkeleton width="80px" height="24px" />
                </div>
                <div className="bg-gray-100 p-6 rounded-2xl">
                  <LoadingSkeleton variant="text" lines={3} />
                </div>
              </div>

              {/* Experience Section Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LoadingSkeleton variant="circular" width="20px" height="20px" />
                      <LoadingSkeleton width="96px" height="20px" />
                    </div>
                    <LoadingSkeleton width="64px" height="24px" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 border border-gray-100 rounded-lg">
                        <LoadingSkeleton width="192px" height="16px" className="mb-2" />
                        <LoadingSkeleton width="128px" height="12px" className="mb-1" />
                        <LoadingSkeleton width="160px" height="12px" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Education Section Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LoadingSkeleton variant="circular" width="20px" height="20px" />
                      <LoadingSkeleton width="80px" height="20px" />
                    </div>
                    <LoadingSkeleton width="64px" height="24px" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="p-3 border border-gray-100 rounded-lg">
                    <LoadingSkeleton width="160px" height="16px" className="mb-2" />
                    <LoadingSkeleton width="192px" height="12px" className="mb-1" />
                    <LoadingSkeleton width="128px" height="12px" className="mb-1" />
                    <LoadingSkeleton width="96px" height="12px" />
                  </div>
                </div>
              </div>

              {/* Certifications Section Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LoadingSkeleton variant="circular" width="20px" height="20px" />
                      <LoadingSkeleton width="160px" height="20px" />
                    </div>
                    <LoadingSkeleton width="64px" height="24px" />
                  </div>
                </div>
                <div className="p-4">
                  <LoadingSkeleton width="256px" height="16px" className="mx-auto" />
                </div>
              </div>

              {/* Network Section Skeleton */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-200 p-6" style={{ animationDuration: '1s' }}>
                  <div className="flex items-center gap-3">
                    <LoadingSkeleton variant="circular" width="40px" height="40px" className="rounded-xl bg-gray-300" />
                    <LoadingSkeleton width="192px" height="24px" className="bg-gray-300" />
                  </div>
                </div>
                <div className="p-8">
                  <div className="bg-gray-100 p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <LoadingSkeleton variant="circular" width="48px" height="48px" className="rounded-xl" />
                      <div className="flex-1">
                        <LoadingSkeleton variant="text" lines={2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}