'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ProfileSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';

interface User {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  bannerImage?: string;
  bio?: string;
  headline?: string;
  location?: string;
  skills?: string[];
  experience?: string;
  isVerified?: boolean;
  stats?: {
    connections: number;
    posts: number;
    showcases: number;
    interviews?: {
      total: number;
      selected: number;
      rejected: number;
      score: number;
    };
  };
  createdAt: string;
}

interface Poster {
  _id: string;
  image: string;
  isActive: boolean;
}

export default function ShowcasePage() {
  return (
    <ProtectedRoute>
      <ShowcaseContent />
    </ProtectedRoute>
  );
}

function ShowcaseContent() {
  const router = useRouter();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-rotate posters and preload images
  useEffect(() => {
    if (posters.length <= 1) return;

    // Preload all images for faster switching
    posters.forEach((poster, index) => {
      if (poster.image) {
        const img = new Image();
        img.src = poster.image;
      }
    });

    const interval = setInterval(() => {
      setCurrentPosterIndex((prev) => 
        prev === posters.length - 1 ? 0 : prev + 1
      );
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [posters]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && posters.length > 1) {
      // Swipe left - next image
      setCurrentPosterIndex(prev => prev === posters.length - 1 ? 0 : prev + 1);
    }
    if (isRightSwipe && posters.length > 1) {
      // Swipe right - previous image
      setCurrentPosterIndex(prev => prev === 0 ? posters.length - 1 : prev - 1);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Create abort controllers for timeout
      const usersController = new AbortController();
      const postersController = new AbortController();
      
      const usersTimeout = setTimeout(() => usersController.abort(), 3000);
      const postersTimeout = setTimeout(() => postersController.abort(), 3000);
      
      // Fetch users and posters in parallel with timeout
      const [usersRes, postersRes] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?limit=50`, {
          signal: usersController.signal
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/showcases/posters`, {
          signal: postersController.signal
        })
      ]);

      clearTimeout(usersTimeout);
      clearTimeout(postersTimeout);

      // Handle users response
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        // Users data not needed for current functionality
      }

      // Handle posters response
      if (postersRes.status === 'fulfilled' && postersRes.value.ok) {
        const postersData = await postersRes.value.json();
        setPosters(postersData.posters || []);
      }

      // Get current user info from localStorage (no API call needed)
      const token = localStorage.getItem('authToken');
      if (token) {
        const currentUserData = localStorage.getItem('currentUser');
        if (currentUserData) {
          try {
            const user = JSON.parse(currentUserData);
            setCurrentUser(user);
          } catch (e) {
            console.error('Error parsing current user data:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching showcase data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-8">
        <div className="w-full flex justify-center px-3 sm:px-4 py-4 sm:py-8">
          <div className="w-full lg:w-[1200px]">
            
            {/* Header Skeleton */}
            <div className="mb-6 sm:mb-8 text-center">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2 animate-pulse"></div>
            </div>

            {/* Banner Skeleton */}
            <div className="relative mb-6 sm:mb-8 flex justify-center">
              <div className="w-full max-w-5xl h-[280px] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            </div>

            {/* Your Profile Skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6 animate-pulse"></div>
              <ProfileSkeleton />
            </div>

            {/* Showcase Results Skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse"></div>
              <div className="text-center py-16">
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-3 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-80 mx-auto mb-6 animate-pulse"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-8">
      <div className="w-full flex justify-center px-3 sm:px-4 py-4 sm:py-8">
        <div className="w-full lg:w-[1200px]">
          
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center">
          </div>

          {/* Three Posters - Carousel Style */}
          {posters.length > 0 && (
            <div className="relative mb-5 sm:mb-7 flex justify-center">
              <div 
                className="relative w-full max-w-5xl h-[140px] sm:h-[200px] md:h-[240px] lg:h-[280px] rounded-xl overflow-hidden shadow-lg cursor-pointer select-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={posters[currentPosterIndex]?.image}
                  alt="Showcase Banner"
                  className="w-full h-full object-cover object-center transition-opacity duration-300"
                  loading="eager"
                  fetchPriority="high"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling!.classList.remove('hidden');
                  }}
                  draggable={false}
                />
                <div className="hidden w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-gray-500">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm">Image not available</p>
                  </div>
                </div>
                
                {/* Navigation Arrows - Hidden on mobile, visible on tablet+ */}
                {posters.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentPosterIndex(prev => prev === 0 ? posters.length - 1 : prev - 1);
                      }}
                      className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white transition-colors z-10"
                      aria-label="Previous banner"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentPosterIndex(prev => prev === posters.length - 1 ? 0 : prev + 1);
                      }}
                      className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white transition-colors z-10"
                      aria-label="Next banner"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Dots Indicator - Hidden on mobile, visible on desktop */}
                    <div className="hidden sm:flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-2 z-10">
                      {posters.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentPosterIndex(index);
                          }}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentPosterIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                          aria-label={`Go to banner ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                {/* Mobile swipe indicator - better positioned */}
                {posters.length > 1 && (
                  <div className="sm:hidden absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 text-white text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    {currentPosterIndex + 1}/{posters.length}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Your Profile */}
          {currentUser && (
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Your Profile
              </h2>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  {/* Left: Profile Image & Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-[#0BC0DF] to-[#0aa9c4] flex items-center justify-center">
                        {currentUser.profileImage ? (
                          <img 
                            src={currentUser.profileImage} 
                            alt={currentUser.name}
                            className="w-full h-full object-cover"
                            loading="eager"
                            fetchPriority="high"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {currentUser.name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      {currentUser.isVerified && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">
                        {currentUser.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {currentUser.bio || currentUser.headline || 'Professional profile'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Center: Stats */}
                  <div className="hidden sm:flex gap-4 mx-4">
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        {currentUser.stats?.interviews?.selected || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Selected</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-bold text-red-600 dark:text-red-400">
                        {currentUser.stats?.interviews?.rejected || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Rejected</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-500">
                        {currentUser.stats?.interviews?.total || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-bold text-yellow-500">
                        {currentUser.stats?.interviews?.score || 0}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
                    </div>
                  </div>
                  
                  {/* Right: Edit Button */}
                  <div className="flex-shrink-0">
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/profile/${currentUser._id}`)}
                      className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white text-xs px-4 py-2 rounded-lg"
                    >
                      View & Edit Profile
                    </Button>
                  </div>
                </div>
                
                {/* Mobile Stats - Show below on small screens */}
                <div className="sm:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex gap-4 justify-center text-xs">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {currentUser.stats?.interviews?.selected || 0}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">Selected</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {currentUser.stats?.interviews?.rejected || 0}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">Rejected</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {currentUser.stats?.interviews?.total || 0}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">Total</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {currentUser.stats?.interviews?.score || 0}%
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">Score</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Showcase Results Coming Soon */}
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Showcase Results
            </h2>
            
            <div className="text-center py-8 sm:py-16">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Results Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-base sm:text-lg">
                  Showcase section results will be shown after 1 month
                </p>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-blue-100 dark:border-blue-800">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    We're currently collecting and analyzing showcase submissions. 
                    Check back in a month to see the top profiles from our community!
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}