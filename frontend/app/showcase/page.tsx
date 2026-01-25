'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import SimpleLoader from '@/components/SimpleLoader';
import { Button } from '@/components/ui/button';
import {
  SparklesIcon,
  EyeIcon,
  PencilIcon,
  StarIcon,
  HeartIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

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
  const [users, setUsers] = useState<User[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-rotate posters
  useEffect(() => {
    if (posters.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPosterIndex((prev) => 
        prev === posters.length - 1 ? 0 : prev + 1
      );
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [posters.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users and posters in parallel
      const [usersRes, postersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?limit=50`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/showcases/posters`)
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (postersRes.ok) {
        const postersData = await postersRes.json();
        setPosters(postersData.posters || []);
      }

      // Get current user info
      const token = localStorage.getItem('authToken');
      if (token) {
        const currentUserData = localStorage.getItem('currentUser');
        if (currentUserData) {
          const user = JSON.parse(currentUserData);
          setCurrentUser(user);
        }
      }
    } catch (error) {
      console.error('Error fetching showcase data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupUsersByDomain = (users: User[]) => {
    const grouped = users.reduce((acc, user) => {
      const domain = user.experience || user.headline || 'Other';
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(user);
      return acc;
    }, {} as Record<string, User[]>);

    // Sort domains by number of users (descending)
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.length - a.length)
      .reduce((acc, [domain, users]) => {
        acc[domain] = users;
        return acc;
      }, {} as Record<string, User[]>);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <SimpleLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-8">
      <div className="w-full flex justify-center px-3 sm:px-4 py-4 sm:py-8">
        <div className="w-full lg:w-[1200px]">
          
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Showcase
            </h1>
          </div>

          {/* Three Posters - Carousel Style */}
          {posters.length > 0 && (
            <div className="relative mb-6 sm:mb-8 flex justify-center">
              <div className="relative w-full max-w-5xl h-[280px] rounded-xl overflow-hidden shadow-lg">
                <img
                  src={posters[currentPosterIndex]?.image}
                  alt="Showcase Banner"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling!.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-gray-500">
                  Image not available
                </div>
                
                {/* Navigation Arrows */}
                {posters.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentPosterIndex(prev => prev === 0 ? posters.length - 1 : prev - 1);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors z-10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentPosterIndex(prev => prev === posters.length - 1 ? 0 : prev + 1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors z-10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Dots Indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
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
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Your Profile */}
          {currentUser && (
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Your Profile
              </h2>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-4">
                  {/* Profile Image */}
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[#0BC0DF] flex items-center justify-center">
                    {currentUser.profileImage ? (
                      <img 
                        src={currentUser.profileImage} 
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {currentUser.name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {currentUser.name}
                      </h3>
                      {currentUser.isVerified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {currentUser.bio || currentUser.headline || 'No bio available'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span>{currentUser.stats?.connections || 0} connections</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{currentUser.stats?.posts || 0} posts</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/profile/${currentUser._id}`)}
                      className="text-[#0BC0DF] border-[#0BC0DF] hover:bg-[#0BC0DF] hover:text-white"
                    >
                      View Profile
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => router.push('/profile')}
                      className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Showcase Results Coming Soon */}
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Showcase Results
            </h2>
            
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-8 max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Results Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                  Showcase section results will be shown after 1 month
                </p>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
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