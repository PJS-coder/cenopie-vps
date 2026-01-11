"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PostCard from '@/components/PostCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProfileSidebar from '@/components/ProfileSidebar';
import PeopleYouMayKnow from '@/components/PeopleYouMayKnow';
import { useUserPosts } from '@/hooks/useUserPosts';
import { profileApi } from '@/lib/api';
import Image from 'next/image';

interface UserProfile {
  id: string;
  name: string;
  headline?: string;
  profileImage?: string;
  isVerified?: boolean;
}

export default function UserPostsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { posts, loading, error, loadMore, hasMore } = useUserPosts(userId);

  // Fetch user profile and current user info
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user
        const currentUserResponse = await profileApi.getProfile();
        const currentUser = currentUserResponse.data?.user;
        setCurrentUserId(currentUser?.id || currentUser?._id || null);

        // Get target user profile
        const profileResponse = await profileApi.getProfileById(userId);
        const userProfile = profileResponse.data?.user;
        
        if (userProfile) {
          setProfile({
            id: userProfile.id || userProfile._id,
            name: userProfile.name,
            headline: userProfile.headline,
            profileImage: userProfile.profileImage,
            isVerified: (userProfile as any).isVerified // Type assertion for isVerified
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading && posts.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Posts Skeleton */}
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md">
            <div className="text-red-800 dark:text-red-200 font-medium text-lg mb-2">Error loading posts</div>
            <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full flex justify-center px-4 lg:px-6">
          <div className="w-full lg:w-[1200px] py-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Center Content Area */}
              <div className="lg:col-span-3">
                {/* Posts */}
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500">
                      {profile?.name || 'This user'} hasn't shared any posts yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posts.map((post: any) => (
                      <PostCard
                        key={post.id}
                        id={post.id}
                        author={post.author}
                        role={post.role}
                        content={post.content}
                        likes={post.likes}
                        comments={post.comments}
                        shares={post.shares}
                        timestamp={post.timestamp}
                        image={post.image}
                        mediaType={post.mediaType}
                        isUserConnected={post.isConnected}
                        currentUserId={currentUserId || undefined}
                        postAuthorId={post.authorId}
                        profileImage={post.profileImage}
                        isRepost={post.isRepost}
                        originalPost={post.originalPost}
                        isVerified={post.isVerified}
                      />
                    ))}

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="text-center pt-6">
                        <Button
                          onClick={loadMore}
                          disabled={loading}
                          variant="outline"
                          className="border-[#0BC0DF] text-[#0BC0DF] hover:bg-[#0BC0DF] hover:text-white"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                              Loading...
                            </>
                          ) : (
                            'Load More Posts'
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Loading indicator for additional posts */}
                    {loading && posts.length > 0 && (
                      <div className="text-center py-4">
                        <div className="w-6 h-6 mx-auto animate-spin rounded-full border-2 border-[#0BC0DF] border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Left Sidebar - Profile Card */}
              <div className="lg:col-span-1 lg:order-first">
                <ProfileSidebar userId={currentUserId || ''} currentUserId={currentUserId} />
              </div>

              {/* Right Sidebar - People You May Know */}
              <div className="lg:col-span-1">
                <PeopleYouMayKnow currentUserId={currentUserId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
