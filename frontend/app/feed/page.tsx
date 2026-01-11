"use client";
import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import Image from 'next/image';
import PostCard from '@/components/PostCard';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import { Button } from '@/components/ui/button';
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  DocumentTextIcon, 
  BookmarkIcon,
  BriefcaseIcon,
  UserGroupIcon,
  NewspaperIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  FireIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useFeed } from '@/hooks/useFeed';
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers';
import { useConnections } from '@/hooks/useConnections';
import { profileApi, mediaApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import VerificationBadge from '@/components/VerificationBadge';
import { FeedSkeleton } from '@/components/OptimizedLoader';
import { useToastContext } from '@/components/ToastProvider';
import { useNews } from '@/hooks/useNews';

interface CurrentUser {
  id?: string;
  _id?: string;
  name?: string;
  role?: string;
  company?: string;
  college?: string;
  connections?: number;
  profileViews?: number;
  profileImage?: string;
  bannerImage?: string;
  headline?: string;
  bio?: string;
  followers?: string[];
  isVerified?: boolean;
}

// Define the user profile interface to match the API response
interface UserProfile {
  _id: string;
  id: string;
  name: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  pronouns?: string;
  links?: { label: string; url: string }[];
  education?: {
    _id?: string;
    college: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear: number;
    current: boolean;
  }[];
  experience?: {
    _id?: string;
    company: string;
    jobTitle: string;
    employmentType: string;
    startDate: string;
    endDate?: string;
    description?: string;
    current: boolean;
  }[];
  skills?: {
    _id?: string;
    name: string;
    proficiency: string;
  }[];
  profileImage?: string;
  bannerImage?: string;
  interviewsCompleted?: number;
  applicationsSent?: number;
  profileViews?: number;
  successRate?: number;
  followers?: string[];
  following?: string[];
  createdAt: string;
  isVerified?: boolean;
}

export default function FeedPage() {
  const router = useRouter();
  const toast = useToastContext();
  const [activeFilter, setActiveFilter] = useState<'all' | 'following'>('all');
  const [showTrending, setShowTrending] = useState(false);
  const { posts, loading, error, fetchFeed, loadMore, hasMore, createPost, likePost, repostPost, deletePost, commentOnPost, deleteComment } = useFeed({ filter: activeFilter });
  const [postContent, setPostContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isArticleMode, setIsArticleMode] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Quick actions data
  const quickActions = [
    {
      icon: BriefcaseIcon,
      label: 'Find Jobs',
      description: 'Discover new opportunities',
      color: 'text-blue-600 bg-blue-50',
      action: () => router.push('/jobs')
    },
    {
      icon: UserGroupIcon,
      label: 'Network',
      description: 'Connect with professionals',
      color: 'text-purple-600 bg-purple-50',
      action: () => router.push('/network')
    },
    {
      icon: NewspaperIcon,
      label: 'Industry News',
      description: 'Stay updated',
      color: 'text-green-600 bg-green-50',
      action: () => setShowTrending(true)
    },
    {
      icon: SparklesIcon,
      label: 'Showcase',
      description: 'View top profiles',
      color: 'text-yellow-600 bg-yellow-50',
      action: () => router.push('/showcase')
    }
  ];

  // Function to check if a post is saved
  const isPostSaved = (postId: string): boolean => {
    try {
      const savedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
      return savedPosts.some((savedPost: any) => savedPost.id === postId);
    } catch (error) {
      console.error('Error checking if post is saved:', error);
      return false;
    }
  };
  
  // Current user data loading state
  const currentUserLoading = !currentUser;

  // Infinite scroll implementation
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 1.0
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [handleObserver]);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await profileApi.getProfile();
        console.log('Profile response:', response);
        
        // Extract user data from response
        const userData = response.data?.user || (response as any).user;
        
        if (userData) {
          // Get company from experience
          const company = (userData as UserProfile).experience?.find((exp: any) => exp.current)?.company || 
                         (userData as UserProfile).experience?.[0]?.company;
          
          // Get college from education
          const college = (userData as UserProfile).education?.find((edu: any) => edu.current)?.college || 
                         (userData as UserProfile).education?.[0]?.college;
          
          // Transform the user data to match our CurrentUser interface
          const transformedUser: CurrentUser = {
            id: (userData as UserProfile).id || (userData as UserProfile)._id,
            _id: (userData as UserProfile)._id || (userData as UserProfile).id,
            name: (userData as UserProfile).name,
            role: (userData as UserProfile).headline || 'Professional', // Use headline as role
            company: company,
            college: college,
            connections: (userData as UserProfile).followers?.length || 0,
            profileViews: (userData as UserProfile).profileViews || 0,
            profileImage: (userData as UserProfile).profileImage,
            bannerImage: (userData as UserProfile).bannerImage,
            headline: (userData as UserProfile).headline,
            bio: (userData as UserProfile).bio,
            followers: (userData as UserProfile).followers,
            isVerified: (userData as UserProfile).isVerified
          };
          
          setCurrentUser(transformedUser);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);
  
  // Add this after the other useEffect hooks
  const { users: suggestedUsers, loading: suggestedUsersLoading, error: suggestedUsersError } = useSuggestedUsers();
  const { connections, loading: connectionsLoading } = useConnections();
  const { news, loading: newsLoading, error: newsError, refreshNews } = useNews(5);
  

  // Remove individual file
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  // Handle single file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0]; // Only take the first file

    try {
      // Check file size (e.g., 50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Please select files smaller than 50MB.`);
        e.target.value = '';
        return;
      }

      // Check video duration if it's a video file
      if (file.type.startsWith('video/')) {
        const duration = await getVideoDuration(file);
        const maxDuration = 2 * 60; // 2 minutes in seconds
        
        if (duration > maxDuration) {
          alert(`Video "${file.name}" is too long. Please select videos shorter than 2 minutes.`);
          e.target.value = '';
          return;
        }
      }

      // Replace any existing file
      setSelectedFiles([file]);
      
      // Clean up old preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      const url = URL.createObjectURL(file);
      setPreviewUrls([url]);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    }
    
    e.target.value = ''; // Clear the input
  };

  // Helper function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Error loading video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Handle file upload to get URL
  const uploadFile = async (file: File): Promise<{ url: string; mediaType: string }> => {
    try {
      const url = await mediaApi.uploadFile(file);
      
      // Determine media type based on file type
      let mediaType = 'image';
      if (file.type.startsWith('video/')) {
        mediaType = 'video';
      }
      
      return { url, mediaType };
    } catch (error) {
      console.error('File upload error:', error);
      
      // Throw user-friendly error messages
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes('file too large')) {
          throw new Error('File too large');
        } else if (error.message.toLowerCase().includes('network')) {
          throw new Error('Network error during file upload');
        } else if (error.message.toLowerCase().includes('unauthorized')) {
          throw new Error('Unauthorized - please login again');
        }
      }
      
      throw error;
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || isPosting) return;

    try {
      // Set posting state to true to prevent multiple submissions
      setIsPosting(true);
      
      // Text content is now always required by frontend validation
      const finalContent = postContent.trim();
      
      // This should never happen due to frontend validation, but add as safety check
      if (!finalContent) {
        throw new Error('Text content is required.');
      }

      if (selectedFiles.length === 0) {
        // No files - create a single text/article post
        const mediaType = isArticleMode ? 'article' : undefined;
        await createPost(finalContent, undefined, mediaType);
      } else {
        // Upload single file only
        const uploadResult = await uploadFile(selectedFiles[0]);
        await createPost(finalContent, uploadResult.url, uploadResult.mediaType);
      }
      setPostContent('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      setIsArticleMode(false);
    } catch (err) {
      console.error('Failed to create post:', err);
      
      // Show user-friendly error messages
      let errorMessage = 'Failed to create post. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes('file too large')) {
          errorMessage = 'File is too large. Please select a smaller file (max 50MB).';
        } else if (err.message.toLowerCase().includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.toLowerCase().includes('unauthorized')) {
          errorMessage = 'Session expired. Please refresh the page and try again.';
        } else if (err.message.toLowerCase().includes('content')) {
          errorMessage = 'Please add some text content to your post.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      // Reset posting state
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    console.log('=== FEED HANDLE LIKE ===');
    console.log('Post ID:', postId);
    
    try {
      await likePost(postId);
      console.log('Feed like completed successfully');
    } catch (err) {
      console.error('Feed like failed:', err);
      // Error is already handled in likePost function with revert
    }
  };

  const handleRepost = async (postId: string, repostComment?: string) => {
    try {
      // Call the repost API with the repostComment parameter
      await repostPost(postId, repostComment);
    } catch (err) {
      console.error('Failed to repost:', err);
      // Show an error message to the user
      alert('Failed to repost: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleSave = async (postId: string) => {
    try {
      console.log('Saving post:', postId);
      
      // Find the post to save
      const postToSave = posts.find(post => post.id === postId);
      if (!postToSave) {
        alert('Post not found');
        return;
      }

      // Get existing saved posts from localStorage
      const existingSavedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
      
      // Check if post is already saved
      const isAlreadySaved = existingSavedPosts.some((savedPost: any) => savedPost.id === postId);
      
      if (isAlreadySaved) {
        // Remove from saved posts (unsave)
        const updatedSavedPosts = existingSavedPosts.filter((savedPost: any) => savedPost.id !== postId);
        localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
        alert('Post removed from saved items');
      } else {
        // Add to saved posts
        const savedPost = {
          ...postToSave,
          savedAt: new Date().toISOString(),
          isSaved: true
        };
        const updatedSavedPosts = [savedPost, ...existingSavedPosts];
        localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
        alert('Post saved successfully!');
      }
      
      // Dispatch event to update other components
      window.dispatchEvent(new Event('savedPostsUpdated'));
      
    } catch (err) {
      console.error('Failed to save post:', err);
      alert('Failed to save post: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleShare = (postId: string) => {
    // For now, we'll just show an alert
    // In a real implementation, this could open a share dialog
    alert(`Share post ${postId}`);
  };

  const handleDelete = async (postId: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this post?')) {
        await deletePost(postId);
        // Show a success message
        console.log('Post deleted successfully');
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
      // Show a toast to the user
      toast.error('Failed to delete post: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      console.log(`Handling delete comment request for post ${postId}, comment ${commentId}`);
      // Submit the comment deletion
      await deleteComment(postId, commentId);
      console.log(`Successfully handled delete comment request for post ${postId}, comment ${commentId}`);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      // Show a more user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Failed to delete comment: ' + errorMessage);
    }
  };

  // Handle messaging functionality
  const handleMessage = useCallback((userId: string) => {
    console.log('handleMessage called with userId:', userId);
    // Store the target user ID in localStorage for reference
    localStorage.setItem('messageTargetUserId', userId);
    
    // Also store in recent users
    const storedUsers = JSON.parse(localStorage.getItem('recentUsers') || '{}');
    // We'll update this when we get the user's name from the messages page
    if (!storedUsers[userId]) {
      storedUsers[userId] = 'Unknown User';
      localStorage.setItem('recentUsers', JSON.stringify(storedUsers));
    }
    
    // Navigate to messages without full page reload
    router.push(`/messages?user=${userId}`);
  }, [router]);

  const handleComment = async (postId: string, commentText?: string) => {
    try {
      if (commentText) {
        // Submit the comment
        await commentOnPost(postId, commentText);
        // Don't refresh the feed - the comment will be added to the UI immediately
        // The comment input will stay visible so the user can see their comment
      } else {
        // Just log that the comment button was clicked
        console.log(`Comment button clicked for post ${postId}`);
      }
    } catch (err) {
      console.error('Failed to comment on post:', err);
      // You might want to show an error message to the user
      alert('Failed to add comment: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Get user initials safely
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  // Memoized PostCard component to prevent unnecessary re-renders
  const MemoizedPostCard = memo(PostCard);

  if (loading && posts.length === 0) {
    return (
      <ProtectedRoute>
        <FeedSkeleton />
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen">
        <div className="text-center">
            <h2 className="text-xl font-bold text-red-500">Error loading feed</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show a message when there are no posts
  if (posts.length === 0 && !loading) {
    return (
      <ProtectedRoute>
        <div className="w-full flex justify-center px-4 lg:px-6 pb-8 pt-6">
          <div className="w-full lg:w-[1200px]">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Sidebar - Profile Section */}
          <div className="lg:col-span-1 order-1">
            <div className="lg:sticky lg:top-[80px] space-y-6">
              {/* User Profile Banner Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                {/* Banner Image */}
                <div 
                  className="relative h-24 w-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    const userId = currentUser?.id || currentUser?._id;
                    if (userId) {
                      router.push(`/profile/${userId}`);
                    } else {
                      router.push('/profile');
                    }
                  }}
                  title="View your profile"
                >
                  {currentUser?.bannerImage ? (
                    <Image 
                      src={currentUser.bannerImage} 
                      alt="Profile banner" 
                      className="w-full h-full object-cover"
                      fill
                      sizes="100vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                  )}
                  {/* Profile Image - centered horizontally */}
                  <div 
                    className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 cursor-pointer hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      const userId = currentUser?.id || currentUser?._id;
                      if (userId) {
                        router.push(`/profile/${userId}`);
                      } else {
                        router.push('/profile');
                      }
                    }}
                    title="View your profile"
                  >
                    {currentUser?.profileImage ? (
                      <Image 
                        src={currentUser.profileImage} 
                        alt={currentUser.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                        width={80}
                        height={80}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#E6F7FC] dark:bg-[#0a4d5c] flex items-center justify-center text-[#0BC0DF] font-semibold">
                        {currentUser?.name ? getUserInitials(currentUser.name) : (
                          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Profile Content */}
                <div className="p-5 pt-10">
                  <div className="flex flex-col items-center text-center">
                    <h4 
                      className="font-semibold text-gray-900 dark:text-white flex items-center justify-center space-x-2 cursor-pointer hover:text-[#0BC0DF] transition-colors"
                      onClick={() => {
                        const userId = currentUser?.id || currentUser?._id;
                        if (userId) {
                          router.push(`/profile/${userId}`);
                        } else {
                          router.push('/profile');
                        }
                      }}
                      title="View your profile"
                    >
                      <span>{currentUser?.name ? currentUser.name : (
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse inline-block"></div>
                      )}</span>
                      <VerificationBadge isVerified={currentUser?.isVerified} size="md" />
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{currentUser?.role || 'Professional'}</p>
                    {(() => {
                      // Show company if available, otherwise show college, otherwise nothing
                      const displayText = currentUser?.company || currentUser?.college;
                      return displayText ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{displayText}</p>
                      ) : null;
                    })()}
                    {currentUser?.bio && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-3">{currentUser.bio}</p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div 
                      className="flex justify-between text-sm mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 -mx-2 px-2 py-1 rounded transition-colors"
                      onClick={() => router.push('/notifications?tab=network')}
                    >
                      <span className="text-gray-500 dark:text-gray-400">Connections</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {connectionsLoading ? '...' : connections.length.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Enhanced */}
              <div className="hidden md:block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                    <button
                      onClick={() => setShowQuickActions(!showQuickActions)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <PlusIcon className={`w-4 h-4 text-gray-500 transition-transform ${showQuickActions ? 'rotate-45' : ''}`} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="w-full flex items-center gap-3 px-3 py-3 text-sm text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                      <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{action.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{action.description}</div>
                      </div>
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => router.push('/saved')}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <BookmarkIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Saved Items</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Your bookmarked content</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Center Feed */}
          <div className="lg:col-span-3 order-2 space-y-2">


            {/* Create Post */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#E6F7FC] dark:bg-[#0a4d5c] flex items-center justify-center text-[#0BC0DF] font-semibold flex-shrink-0">
                      {currentUser?.profileImage ? (
                        <Image 
                          src={currentUser.profileImage} 
                          alt={currentUser.name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#0BC0DF] text-sm font-semibold">
                          {getUserInitials(currentUser?.name || 'User')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* File upload input - hidden */}
                      <input
                        type="file"
                        id="file-upload-empty"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                      />
                      
                      {/* Photo button */}
                      <label 
                        htmlFor="file-upload-empty"
                        className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                        title="Add photo (max 50MB)"
                      >
                        <PhotoIcon className="w-4 h-4" />
                      </label>
                      
                      {/* Video button */}
                      <button
                        type="button"
                        className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        title="Add video (max 2 minutes, 50MB)"
                        onClick={() => {
                          // Trigger file input but filter for video only
                          const input = document.getElementById('file-upload-empty') as HTMLInputElement;
                          if (input) {
                            input.accept = 'video/*';
                            input.click();
                          }
                        }}
                      >
                        <VideoCameraIcon className="w-4 h-4" />
                      </button>
                      
                      {/* Article button */}
                      <button 
                        type="button"
                        className={`p-2 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors ${
                          isArticleMode 
                            ? 'text-purple-500 bg-purple-50 dark:bg-purple-900/10' 
                            : 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                        }`}
                        title="Write article"
                        onClick={() => setIsArticleMode(!isArticleMode)}
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                
                  {/* File Preview */}
                  {previewUrls.length > 0 && (
                    <div className="mt-2">
                      <div className="relative group bg-gray-50 dark:bg-gray-800">
                        {selectedFiles[0]?.type.startsWith('video/') ? (
                          <CustomVideoPlayer 
                            src={previewUrls[0]} 
                            className="w-full h-auto object-contain"
                          />
                        ) : (
                          <Image 
                            src={previewUrls[0]} 
                            alt="Preview" 
                            className="w-full h-auto object-contain"
                            width={400}
                            height={300}
                          />
                        )}
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-black/70 text-white p-1.5 hover:bg-black/90 transition-colors opacity-0 group-hover:opacity-100 rounded-full"
                          onClick={() => {
                            setSelectedFiles([]);
                            previewUrls.forEach(url => URL.revokeObjectURL(url));
                            setPreviewUrls([]);
                          }}
                          title="Remove file"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                
                  <div className="flex items-start">
                    <form onSubmit={handlePostSubmit} className="flex-1 ml-12">
                      {isArticleMode ? (
                        <textarea
                          id="post-input"
                          placeholder="Share your thoughts..."
                          className="w-full bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 focus:border-[#0BC0DF] focus:ring-1 focus:ring-[#E6F7FC] dark:focus:ring-[#0a4d5c] outline-none transition-all min-h-[80px]"
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                        />
                      ) : (
                        <div className="relative">
                          <input
                            id="post-input"
                            type="text"
                            placeholder="Share your thoughts..."
                            className="w-full bg-gray-50 dark:bg-gray-800 rounded-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 focus:border-[#0BC0DF] focus:ring-1 focus:ring-[#E6F7FC] dark:focus:ring-[#0a4d5c] outline-none transition-all pr-10"
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedFiles.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <span>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</span>
                              {!postContent.trim() && (
                                <span className="text-red-500 dark:text-red-400 text-xs">• Text required</span>
                              )}
                            </div>
                          ) : isArticleMode ? (
                            <span>Article • {postContent.length} chars</span>
                          ) : (
                            postContent.trim() ? (
                              <span className="text-green-600 dark:text-green-400">Ready • {postContent.length} chars</span>
                            ) : (
                              <span className="text-red-500 dark:text-red-400">Text required</span>
                            )
                          )}
                        </div>
                        <button 
                          type="submit"
                          disabled={!postContent.trim() || isPosting}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            postContent.trim() && !isPosting
                              ? 'bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                          }`}
                          title={!postContent.trim() ? 'Please add some text content to post' : 'Create post'}
                        >
                          {isPosting ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              <span>Posting...</span>
                            </div>
                          ) : (
                            'Post'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Filters & Empty Message - Merged Container */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
              {/* Feed Filters Header */}
              <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                  <button 
                    onClick={() => setActiveFilter('all')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-2 ${
                      activeFilter === 'all' 
                        ? 'bg-white dark:bg-gray-700 text-[#0BC0DF] shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <EyeIcon className="w-4 h-4" />
                    All Posts
                  </button>
                  <button 
                    onClick={() => setActiveFilter('following')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-2 ${
                      activeFilter === 'following' 
                        ? 'bg-white dark:bg-gray-700 text-[#0BC0DF] shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <HeartIcon className="w-4 h-4" />
                    Following
                  </button>
                  <button 
                    onClick={() => {
                      setShowTrending(!showTrending);
                      if (!showTrending) {
                        setActiveFilter('all'); // Show all posts when trending is enabled
                      }
                    }}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-2 ${
                      showTrending 
                        ? 'bg-white dark:bg-gray-700 text-[#0BC0DF] shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                    Trending
                  </button>
                </div>
              </div>

              {/* Empty Feed Message */}
              <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {activeFilter === 'following' ? 'No posts from people you follow' : 'No posts yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {activeFilter === 'following' 
                  ? 'Follow people to see their posts in your feed' 
                  : 'Be the first to share something with your network!'}
              </p>
              <Button onClick={() => document.getElementById('post-input')?.focus()}>
                Create your first post
              </Button>
              </div>
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="lg:col-span-1 order-3 space-y-6 hidden lg:block">
            {/* Industry News & Trends */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FireIcon className="w-4 h-4 text-orange-500" />
                    Trending Now
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">Live</span>
                </div>
              </div>
              <div className="space-y-0 max-h-80 overflow-y-auto">
                {[
                  { 
                    title: 'AI Revolution in Indian Startups', 
                    company: 'TechCrunch India', 
                    time: '1h ago',
                    trending: true,
                    category: 'Technology'
                  },
                  { 
                    title: 'Remote Work Policies: 2026 Update', 
                    company: 'Economic Times', 
                    time: '3h ago',
                    trending: false,
                    category: 'Workplace'
                  },
                  { 
                    title: 'Green Energy Jobs Surge 300%', 
                    company: 'Business Standard', 
                    time: '5h ago',
                    trending: true,
                    category: 'Jobs'
                  },
                  { 
                    title: 'Fintech Funding Reaches New High', 
                    company: 'Mint', 
                    time: '7h ago',
                    trending: false,
                    category: 'Finance'
                  },
                  { 
                    title: 'Skills Gap in Cybersecurity', 
                    company: 'The Hindu', 
                    time: '9h ago',
                    trending: true,
                    category: 'Security'
                  }
                ].map((news, index) => (
                  <div key={index} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0 group">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-2 group-hover:text-[#0BC0DF] transition-colors">
                          {news.title}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{news.company}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              {news.category}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{news.time}</div>
                        </div>
                      </div>
                      {news.trending && (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-orange-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => setShowTrending(true)}
                  className="w-full text-sm font-medium text-[#0BC0DF] hover:text-[#0aa9c4] transition-colors flex items-center justify-center gap-2"
                >
                  <NewspaperIcon className="w-4 h-4" />
                  View all trending
                </button>
              </div>
            </div>

          {/* Sticky Container for People You May Know and Footer */}
          <div className="lg:sticky lg:top-[80px] space-y-6">
            {/* People You May Know */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">People You May Know</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {suggestedUsersLoading ? (
                  <div className="p-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : suggestedUsersError ? (
                  <div className="p-4 text-center text-red-500">
                    Error loading suggestions
                  </div>
                ) : suggestedUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No suggestions available
                  </div>
                ) : (
                  suggestedUsers.slice(0, 5).map((person: any, index: number) => (
                    <div 
                      key={`${person.id}-${index}`} 
                      className="p-4 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => router.push(`/profile/${person.id}`)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-sm overflow-hidden">
                          {person.profileImage ? (
                            <Image 
                              src={person.profileImage} 
                              alt={person.name} 
                              width={40} 
                              height={40} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{person.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-white truncate flex items-center space-x-1">
                            <span>{person.name}</span>
                            <VerificationBadge isVerified={person.isVerified} size="sm" />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {person.role} {person.company && `• ${person.company}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => router.push('/network')}
                  className="w-full text-sm font-medium text-brand hover:text-brand/80 transition-colors"
                >
                  See all
                </button>
              </div>
            </div>
          
            {/* Footer Links */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2 p-4">
              <div className="flex flex-wrap gap-2">
                <a href="#" className="hover:underline">About</a>
                <span>•</span>
                <a href="#" className="hover:underline">Help</a>
                <span>•</span>
                <a href="#" className="hover:underline">Privacy</a>
                <span>•</span>
                <a href="#" className="hover:underline">Terms</a>
                <span>•</span>
                <a href="#" className="hover:underline">Advertising</a>
              </div>
              <div>© {new Date().getFullYear()} Cenopie</div>
            </div>
          </div>
        </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="w-full flex justify-center px-4 lg:px-6 pb-8 pt-6">
        <div className="w-full lg:w-[1200px]">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Sidebar - Profile Section */}
        <div className="lg:col-span-1 order-1">
          <div className="lg:sticky lg:top-[80px] space-y-6">
            {/* User Profile Banner Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Banner Image */}
              <div 
                className="relative h-24 w-full cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  const userId = currentUser?.id || currentUser?._id;
                  if (userId) {
                    router.push(`/profile/${userId}`);
                  } else {
                    router.push('/profile');
                  }
                }}
                title="View your profile"
              >
                {currentUser?.bannerImage ? (
                  <Image 
                    src={currentUser.bannerImage} 
                    alt="Profile banner" 
                    className="w-full h-full object-cover"
                    fill
                    sizes="100vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                )}
                {/* Profile Image - centered horizontally */}
                <div 
                  className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 cursor-pointer hover:scale-105 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    const userId = currentUser?.id || currentUser?._id;
                    if (userId) {
                      router.push(`/profile/${userId}`);
                    } else {
                      router.push('/profile');
                    }
                  }}
                  title="View your profile"
                >
                  {currentUser?.profileImage ? (
                    <Image 
                      src={currentUser.profileImage} 
                      alt={currentUser.name || 'User'}
                      className="w-full h-full rounded-full object-cover"
                      width={80}
                      height={80}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#E6F7FC] dark:bg-[#0a4d5c] flex items-center justify-center text-[#0BC0DF] font-semibold">
                      {getUserInitials(currentUser?.name || 'User')}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile Content */}
              <div className="p-5 pt-10">
                <div className="flex flex-col items-center text-center">
                  <h4 
                    className="font-semibold text-gray-900 dark:text-white flex items-center justify-center space-x-2 cursor-pointer hover:text-[#0BC0DF] transition-colors"
                    onClick={() => {
                      const userId = currentUser?.id || currentUser?._id;
                      if (userId) {
                        router.push(`/profile/${userId}`);
                      } else {
                        router.push('/profile');
                      }
                    }}
                    title="View your profile"
                  >
                    <span>{currentUser?.name ? currentUser.name : (
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse inline-block"></div>
                    )}</span>
                    <VerificationBadge isVerified={currentUser?.isVerified} size="md" />
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-3">{currentUser?.role || 'Professional'}</p>
                  {(() => {
                    // Show company if available, otherwise show college, otherwise nothing
                    const displayText = currentUser?.company || currentUser?.college;
                    return displayText ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{displayText}</p>
                    ) : null;
                  })()}
                  {currentUser?.bio && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-3">{currentUser.bio}</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div 
                    className="flex justify-between text-sm mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 -mx-2 px-2 py-1 rounded transition-colors"
                    onClick={() => router.push('/notifications?tab=network')}
                  >
                    <span className="text-gray-500 dark:text-gray-400">Connections</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {connectionsLoading ? '...' : connections.length.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions - Hidden on Mobile */}
            <div className="hidden md:block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push('/saved')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <BookmarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-[#0BC0DF] transition-colors" />
                  <span className="flex-1 font-medium">Saved Items</span>
                </button>
                
                <div className="px-3 py-2.5 text-xs text-gray-400 dark:text-gray-500 italic">
                  More features coming soon...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Feed */}
        <div className="lg:col-span-3 order-2 space-y-2">
          {/* Create Post */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#E6F7FC] dark:bg-[#0a4d5c] flex items-center justify-center text-[#0BC0DF] font-semibold flex-shrink-0">
                    {currentUser?.profileImage ? (
                      <Image 
                        src={currentUser.profileImage} 
                        alt={currentUser.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#0BC0DF] text-sm font-semibold">
                        {getUserInitials(currentUser?.name || 'User')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* File upload input - hidden */}
                    <input
                      type="file"
                      id="file-upload-main"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                    
                    {/* Photo button */}
                    <label 
                      htmlFor="file-upload-main"
                      className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                      title="Add photo"
                    >
                      <PhotoIcon className="w-4 h-4" />
                    </label>
                    
                    {/* Video button */}
                    <button
                      type="button"
                      className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      title="Add video"
                      onClick={() => {
                        // Trigger file input but filter for video only
                        const input = document.getElementById('file-upload-main') as HTMLInputElement;
                        if (input) {
                          input.accept = 'video/*';
                          input.click();
                        }
                      }}
                    >
                      <VideoCameraIcon className="w-4 h-4" />
                    </button>
                    
                    {/* Article button */}
                    <button 
                      type="button"
                      className={`p-2 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors ${
                        isArticleMode 
                          ? 'text-purple-500 bg-purple-50 dark:bg-purple-900/10' 
                          : 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                      }`}
                      title="Write article"
                      onClick={() => setIsArticleMode(!isArticleMode)}
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              
                {/* Multiple Files Preview */}
                {previewUrls.length > 0 && (
                  <div className="mt-3">
                    {previewUrls.length === 1 ? (
                      // Single image - full width
                      <div className="relative group bg-gray-50 dark:bg-gray-800">
                        {selectedFiles[0]?.type.startsWith('video/') ? (
                          <CustomVideoPlayer 
                            src={previewUrls[0]} 
                            className="w-full h-auto object-contain"
                          />
                        ) : (
                          <Image 
                            src={previewUrls[0]} 
                            alt="Preview" 
                            className="w-full h-auto object-contain"
                            width={600}
                            height={400}
                          />
                        )}
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-black/70 text-white p-1.5 hover:bg-black/90 transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => removeFile(0)}
                          title="Remove image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      // Multiple images - main image on left, thumbnails on right
                      <div className="flex gap-2">
                        {/* Main image (first image) */}
                        <div className="flex-1 relative group bg-gray-50 dark:bg-gray-800">
                          {selectedFiles[0]?.type.startsWith('video/') ? (
                            <CustomVideoPlayer 
                              src={previewUrls[0]} 
                              className="w-full h-auto object-contain"
                            />
                          ) : (
                            <Image 
                              src={previewUrls[0]} 
                              alt="Main preview" 
                              className="w-full h-auto object-contain"
                              width={400}
                              height={300}
                            />
                          )}
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-black/70 text-white p-1.5 hover:bg-black/90 transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => removeFile(0)}
                            title="Remove image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Thumbnail images on the right */}
                        <div className="w-24 flex flex-col gap-2">
                          {previewUrls.slice(1).map((url, index) => (
                            <div key={index + 1} className="relative group bg-gray-50 dark:bg-gray-800 h-16">
                              {selectedFiles[index + 1]?.type.startsWith('video/') ? (
                                <CustomVideoPlayer 
                                  src={url} 
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Image 
                                  src={url} 
                                  alt={`Thumbnail ${index + 2}`} 
                                  className="w-full h-full object-contain"
                                  width={96}
                                  height={64}
                                />
                              )}
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-black/70 text-white p-1 hover:bg-black/90 transition-colors opacity-0 group-hover:opacity-100"
                                onClick={() => removeFile(index + 1)}
                                title="Remove image"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              </button>
                              {/* Show +X more indicator on last thumbnail if there are more than 4 images */}
                              {previewUrls.length > 4 && index === 2 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-xs">
                                  +{previewUrls.length - 4}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedFiles.length < 4 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        You can add {4 - selectedFiles.length} more image{4 - selectedFiles.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
              
                <div className="flex items-start">
                  <form onSubmit={handlePostSubmit} className="flex-1 ml-12">
                    {isArticleMode ? (
                      <textarea
                        id="post-input"
                        placeholder="Share your thoughts..."
                        className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 focus:border-[#0BC0DF] focus:ring-2 focus:ring-[#E6F7FC] dark:focus:ring-[#0a4d5c] outline-none transition-all min-h-[120px]"
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        disabled={isPosting}
                      />
                    ) : (
                      <div className="relative">
                        <input
                          id="post-input"
                          type="text"
                          placeholder="Share your thoughts..."
                          className="w-full bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 focus:border-[#0BC0DF] focus:ring-2 focus:ring-[#E6F7FC] dark:focus:ring-[#0a4d5c] outline-none transition-all pr-12"
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          disabled={isPosting}
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedFiles.length > 0 ? `1 file selected` : isArticleMode ? 'Writing article' : 'What\'s on your mind?'}
                      </div>
                      <button 
                        type="submit"
                        disabled={(!postContent.trim() && selectedFiles.length === 0) || isPosting}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 ${
                          (postContent.trim() || selectedFiles.length > 0)
                            ? 'bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        } transition-colors ${isPosting ? 'opacity-75 cursor-not-allowed' : ''}`}
                      >
                        {isPosting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Posting...
                          </>
                        ) : 'Post'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Feed Filters */}
          <div className="mb-4">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeFilter === 'all' 
                    ? 'bg-white dark:bg-gray-700 text-[#0BC0DF] shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                All Posts
              </button>
              <button 
                onClick={() => setActiveFilter('following')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeFilter === 'following' 
                    ? 'bg-white dark:bg-gray-700 text-[#0BC0DF] shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Following
              </button>
            </div>
          </div>

          {/* Posts Content */}
          <div className="space-y-4">
              {/* Loading indicator */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#0BC0DF] rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading posts...</p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="p-4">
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="text-red-800 dark:text-red-200 font-medium">Error loading feed</div>
                    <div className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</div>
                    <button 
                      onClick={() => fetchFeed(1, true)}
                      className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-sm rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Feed Posts */}
            {posts.map((post, index) => {
              return post.id && post.author && post.content ? (
                <div key={post.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                  <MemoizedPostCard
                    id={post.id}
                    author={post.author}
                    role={post.role}
                    content={post.content}
                    likes={post.likes}
                    comments={post.comments}
                    commentDetails={post.commentDetails}
                    timestamp={post.timestamp}
                    image={post.image}
                    mediaType={post.mediaType}
                    isUserConnected={post.isConnected}
                    currentUserId={currentUser?._id || currentUser?.id}
                    postAuthorId={post.authorId}
                    profileImage={post.profileImage}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onRepost={handleRepost}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onDeleteComment={handleDeleteComment}
                    onMessage={handleMessage}
                    isLiked={post.isLiked}
                    isSaved={isPostSaved(post.id)}
                    isRepost={post.originalPost ? true : false}
                    isVerified={post.isVerified}
                    originalPost={post.originalPost}
                  />
                </div>
              ) : null;
            })}
            
            {/* Infinite scroll loader */}
            <div ref={loaderRef} className="flex justify-center py-4">
              {loading && posts.length > 0 && (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              )}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  You've reached the end of the feed
                </div>
              )}
            </div>
            
            {/* Empty feed message */}
            {!loading && !error && posts.length === 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {activeFilter === 'following' ? 'No posts from people you follow' : 'Your feed is quiet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {activeFilter === 'following' 
                    ? 'Follow more people to see their posts here' 
                    : 'Share your first post or discover new content'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => document.getElementById('post-input')?.focus()}
                    className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white"
                  >
                    Create Post
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveFilter('all')}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    Browse All
                  </Button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      
        {/* Right Sidebar */}
        <div className="lg:col-span-1 order-3 space-y-6 hidden lg:block">
          {/* Cenopie News - Scrollable */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Cenopie News</h3>
                <button
                  onClick={refreshNews}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Refresh news"
                >
                  ↻
                </button>
              </div>
            </div>
            <div className="space-y-0">
              {newsLoading ? (
                <div className="p-4 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : newsError ? (
                <div className="p-4 text-center">
                  <div className="text-red-500 text-sm mb-2">Error loading news</div>
                  <button
                    onClick={refreshNews}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              ) : news.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">No news available</div>
                  <button
                    onClick={refreshNews}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              ) : (
                news.map((article, index) => (
                  <div 
                    key={article.id} 
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                    onClick={() => router.push(`/news/${article.id}`)}
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">{article.title}</div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2">
                        {article.company.logo && (
                          <img 
                            src={article.company.logo} 
                            alt={article.company.name}
                            className="w-4 h-4 rounded object-cover"
                          />
                        )}
                        <div className="text-xs text-brand font-medium">{article.company.name}</div>
                        {article.company.isVerified && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{article.timeAgo}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => router.push('/news')}
                className="w-full text-sm font-medium text-brand hover:text-brand/80 transition-colors"
              >
                View all news
              </button>
            </div>
          </div>

          {/* Sticky Container for People You May Know and Footer */}
          <div className="lg:sticky lg:top-[80px] space-y-6">
            {/* People You May Know */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">People You May Know</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {suggestedUsersLoading ? (
                  <div className="p-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : suggestedUsersError ? (
                  <div className="p-4 text-center text-red-500">
                    Error loading suggestions
                  </div>
                ) : suggestedUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No suggestions available
                  </div>
                ) : (
                  suggestedUsers.slice(0, 5).map((person: any, index: number) => (
                    <div 
                      key={`${person.id}-${index}`} 
                      className="p-4 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => router.push(`/profile/${person.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-sm">
                          {person.profileImage ? (
                            <Image 
                              src={person.profileImage} 
                              alt={person.name} 
                              width={40} 
                              height={40} 
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span>{person.name.split(' ').map((n: string) => n[0]).join('')}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white flex items-center space-x-1">
                            <span>{person.name}</span>
                            <VerificationBadge isVerified={person.isVerified} size="sm" />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{person.role} • {person.company}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => router.push('/network')}
                  className="w-full text-sm font-medium text-brand hover:text-brand/80 transition-colors"
                >
                  See all
                </button>
              </div>
            </div>
          
            {/* Footer Links */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2 p-4">
              <div className="flex flex-wrap gap-2">
                <a href="#" className="hover:underline">About</a>
                <span>•</span>
                <a href="#" className="hover:underline">Help</a>
                <span>•</span>
                <a href="#" className="hover:underline">Privacy</a>
                <span>•</span>
                <a href="#" className="hover:underline">Terms</a>
                <span>•</span>
                <a href="#" className="hover:underline">Advertising</a>
              </div>
              <div>© {new Date().getFullYear()} Cenopie</div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ProtectedRoute>
  );
}