'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import PostCard from '@/components/PostCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProfileSidebar from '@/components/ProfileSidebar';
import PeopleYouMayKnow from '@/components/PeopleYouMayKnow';
import { useFeed } from '@/hooks/useFeed';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [targetPost, setTargetPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the existing feed hook to get all posts
  const { posts, loading: feedLoading, error: feedError } = useFeed();

  useEffect(() => {
    if (!feedLoading && posts.length > 0) {
      // Find the specific post by ID
      const foundPost = posts.find(post => post.id === postId);
      
      if (foundPost) {
        setTargetPost(foundPost);
        setError(null);
      } else {
        setError('Post not found');
      }
      setLoading(false);
    } else if (feedError) {
      setError('Failed to load post');
      setLoading(false);
    }
  }, [posts, feedLoading, feedError, postId]);

  const getCurrentUserId = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return currentUser._id || currentUser.id;
    } catch (error) {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  if (loading || feedLoading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/feed')}>
              Back to Feed
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
                {/* Single Post Content */}
                {targetPost && (
                  <div className="bg-white rounded-lg shadow-sm">
                    <PostCard
                      id={targetPost.id}
                      author={targetPost.author}
                      role={targetPost.role}
                      content={targetPost.content}
                      likes={targetPost.likes}
                      comments={targetPost.comments}
                      shares={targetPost.shares}
                      timestamp={targetPost.timestamp}
                      image={targetPost.image}
                      mediaType={targetPost.mediaType}
                      isUserConnected={targetPost.isConnected}
                      currentUserId={currentUserId || undefined}
                      postAuthorId={targetPost.authorId}
                      profileImage={targetPost.profileImage}
                      isRepost={targetPost.isRepost}
                      originalPost={targetPost.originalPost}
                    />
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