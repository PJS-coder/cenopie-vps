"use client";

import { useState, useRef, useCallback, memo, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PhotoIcon, VideoCameraIcon, DocumentTextIcon, BookmarkIcon, NewspaperIcon, EyeIcon, HeartIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { mediaApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import VerificationBadge from '@/components/VerificationBadge';
import PostCard from '@/components/PostCard';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import { useToastContext } from '@/components/ToastProvider';
import { useFeed } from '@/hooks/useFeed';
import { useAuth } from '@/context/AuthContext';
import { useNews } from '@/hooks/useNews';
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers';
import { useConnections } from '@/hooks/useConnections';

export default function FeedPage() {
  const router = useRouter();
  const toast = useToastContext();
  const [activeFilter, setActiveFilter] = useState<'all' | 'following'>('all');
  const [showTrending, setShowTrending] = useState(false);
  
  // Use auth context
  const { isAuthenticated } = useAuth();
  
  // Get current user from localStorage (temporary solution)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
      setUserLoading(false);
    }
  }, []);
  
  // Use feed hook
  const feedData = useFeed({ filter: activeFilter });
  const {
    posts, loading, error, fetchFeed, loadMore, hasMore, forceRefreshFeed, createPost, likePost, repostPost, deletePost, loadPostComments, commentOnPost, deleteComment
  } = feedData;

  // Use news hook
  const { news, loading: newsLoading, error: newsError } = useNews();
  
  // Use suggested users hook
  const { users: suggestedUsers, loading: suggestedUsersLoading, error: suggestedUsersError } = useSuggestedUsers();
  
  // Use connections hook
  const { connections, loading: connectionsLoading } = useConnections();

  // Helper function to get user initials
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Helper function to check if post is saved (placeholder)
  const isPostSaved = (postId: string) => {
    return false; // Implement saved posts logic if needed
  };

  const [postContent, setPostContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isArticleMode, setIsArticleMode] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Quick actions - simplified to only show saved items
  const quickActions = [];

  // Infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  // File handling
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const file = files[0];
    try {
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File too large. Max 50MB.`);
        e.target.value = '';
        return;
      }
      setSelectedFiles([file]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      const url = URL.createObjectURL(file);
      setPreviewUrls([url]);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file.');
    }
    e.target.value = '';
  };

  const uploadFile = async (file: File): Promise<{ url: string; mediaType: string }> => {
    try {
      const url = await mediaApi.uploadFile(file);
      return { url, mediaType: file.type.startsWith('video/') ? 'video' : 'image' };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || isPosting) return;
    
    try {
      setIsPosting(true);
      const finalContent = postContent.trim();
      if (!finalContent) throw new Error('Text content is required.');
      
      if (selectedFiles.length === 0) {
        const mediaType = isArticleMode ? 'article' : undefined;
        await createPost(finalContent, undefined, mediaType);
      } else {
        const uploadResult = await uploadFile(selectedFiles[0]);
        await createPost(finalContent, uploadResult.url, uploadResult.mediaType);
      }
      
      setPostContent('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      setIsArticleMode(false);
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('Failed to create post: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsPosting(false);
    }
  };

  // Event handlers
  const handleLike = async (postId: string) => {
    try { await likePost(postId); } catch (err) { console.error('Like failed:', err); }
  };

  const handleRepost = async (postId: string, repostComment?: string) => {
    try { 
      await repostPost(postId, repostComment);
      
      // Show success message
      toast.success('Post reposted successfully! Refreshing feed...');
      
      // Force refresh after repost to ensure it shows up
      setTimeout(async () => {
        await forceRefreshFeed();
        toast.success('Feed refreshed! Your repost should now be visible.');
      }, 1000);
    } catch (err) { 
      console.error('Repost error:', err);
      toast.error('Failed to repost: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const postToSave = posts.find((post: any) => post.id === postId);
      if (!postToSave) return;
      
      const existingSavedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
      const isAlreadySaved = existingSavedPosts.some((savedPost: any) => savedPost.id === postId);
      
      if (isAlreadySaved) {
        const updatedSavedPosts = existingSavedPosts.filter((savedPost: any) => savedPost.id !== postId);
        localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
        alert('Post removed from saved items');
      } else {
        const savedPost = { ...postToSave, savedAt: new Date().toISOString(), isSaved: true };
        const updatedSavedPosts = [savedPost, ...existingSavedPosts];
        localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
        alert('Post saved successfully!');
      }
      
      window.dispatchEvent(new Event('savedPostsUpdated'));
    } catch (err) { 
      alert('Failed to save post'); 
    }
  };

  const handleShare = (postId: string) => alert(`Share post ${postId}`);

  const handleDelete = async (postId: string) => {
    try { if (window.confirm('Delete this post?')) await deletePost(postId); } catch (err) { toast.error('Failed to delete post'); }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try { await deleteComment(postId, commentId); } catch (err) { alert('Failed to delete comment'); }
  };

  const handleMessage = useCallback((userId: string) => {
    localStorage.setItem('messageTargetUserId', userId);
    const storedUsers = JSON.parse(localStorage.getItem('recentUsers') || '{}');
    if (!storedUsers[userId]) {
      storedUsers[userId] = 'Unknown User';
      localStorage.setItem('recentUsers', JSON.stringify(storedUsers));
    }
    router.push(`/messages?user=${userId}`);
  }, [router]);

  const handleComment = async (postId: string, commentText?: string) => {
    try { 
      // Check if user is still authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('User not authenticated, skipping comment operation');
        return;
      }

      if (commentText) {
        // Submitting a new comment
        await commentOnPost(postId, commentText);
      } else {
        // Just clicked comment button - load existing comments
        await loadPostComments(postId);
      }
    } catch (err) { 
      // Only show error if user is still authenticated
      const token = localStorage.getItem('authToken');
      if (token) {
        alert('Failed to load/add comment'); 
      }
    }
  };

  // Loading state - only show full loader on initial mount, not when switching filters
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (!loading && posts.length > 0) {
      setHasLoadedOnce(true);
    }
  }, [loading, posts.length]);

  if (loading && posts.length === 0 && !hasLoadedOnce) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0BC0DF]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  // Error state
  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-500">Error loading feed</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="w-full flex justify-center px-4 lg:px-6 pb-0 lg:pb-8 pt-2 lg:pt-6">
        <div className="w-full lg:w-[1200px] pb-0 lg:pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left Sidebar */}
            <div className="lg:col-span-1 order-1">
              <div className="lg:sticky lg:top-[72px] space-y-6">
                
                {/* User Profile Card */}
                <div className="hidden lg:block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                  <div className="relative h-24 w-full cursor-pointer" onClick={() => {
                    const userId = currentUser?._id || currentUser?.id;
                    if (userId) {
                      router.push(`/profile/${userId}`);
                    } else {
                      router.push('/profile');
                    }
                  }}>
                    {currentUser?.bannerImage ? (
                      <Image 
                        src={currentUser.bannerImage} 
                        alt="Banner" 
                        className="w-full h-full object-cover" 
                        fill 
                        sizes="100vw" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                    )}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800">
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
                          {currentUser?.name ? getUserInitials(currentUser.name) : <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 pt-10">
                    <div className="flex flex-col items-center text-center">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <span className="cursor-pointer hover:text-[#0BC0DF] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const userId = currentUser?._id || currentUser?.id;
                            if (userId) {
                              router.push(`/profile/${userId}`);
                            } else {
                              router.push('/profile');
                            }
                          }}
                        >
                          {currentUser?.name || <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>}
                        </span>
                        <VerificationBadge isVerified={currentUser?.isVerified} size="md" />
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {currentUser?.role || 'Professional'}
                      </p>
                      {(currentUser?.company || currentUser?.college) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {currentUser?.company || currentUser?.college}
                        </p>
                      )}
                      {currentUser?.bio && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-3">
                          {currentUser.bio}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => router.push('/notifications?tab=network')}>
                        <span className="text-gray-500 dark:text-gray-400">Connections</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {connectionsLoading ? '...' : connections.length.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="hidden lg:block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <button onClick={() => router.push('/saved')} className="w-full flex items-center gap-3 px-3 py-3 text-sm text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BookmarkIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">Saved Items</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Your bookmarked content</div>
                      </div>
                    </button>
                    <div className="px-3 py-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Other features coming soon</p>
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
                        <input 
                          type="file" 
                          id="file-upload" 
                          className="hidden" 
                          accept="image/*,video/*" 
                          onChange={handleFileChange} 
                        />
                        <label htmlFor="file-upload" className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer" title="Add photo">
                          <PhotoIcon className="w-4 h-4" />
                        </label>
                        <button 
                          type="button" 
                          className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors" 
                          title="Add video" 
                          onClick={() => { 
                            const input = document.getElementById('file-upload') as HTMLInputElement; 
                            if (input) { 
                              input.accept = 'video/*'; 
                              input.click(); 
                            } 
                          }}
                        >
                          <VideoCameraIcon className="w-4 h-4" />
                        </button>
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
                            <CustomVideoPlayer src={previewUrls[0]} className="w-full h-auto object-contain" />
                          ) : (
                            <Image 
                              src={previewUrls[0]} 
                              alt="Preview" 
                              className="w-full h-auto max-h-[300px] object-contain" 
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
                          <input 
                            id="post-input" 
                            type="text" 
                            placeholder="Share your thoughts..." 
                            className="w-full bg-gray-50 dark:bg-gray-800 rounded-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 focus:border-[#0BC0DF] focus:ring-1 focus:ring-[#E6F7FC] dark:focus:ring-[#0a4d5c] outline-none transition-all pr-10" 
                            value={postContent} 
                            onChange={(e) => setPostContent(e.target.value)} 
                          />
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedFiles.length > 0 ? (
                              <div className="flex items-center gap-1">
                                <span>{selectedFiles.length} file selected</span>
                                {!postContent.trim() && <span className="text-red-500 dark:text-red-400 text-xs">• Text required</span>}
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
                          >
                            {isPosting ? (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Posting...</span>
                              </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 flex-1 mr-3">
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
                  </div>
                  <button
                    onClick={forceRefreshFeed}
                    disabled={loading}
                    className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                    title="Refresh feed"
                  >
                    <svg 
                      className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Posts Content */}
              <div className="space-y-4">
                {loading && posts.length === 0 && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 animate-pulse">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="p-4">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="text-red-800 dark:text-red-200 font-medium">Error loading feed</div>
                      <div className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</div>
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => fetchFeed(1, true)} 
                          className="px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-sm rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                        >
                          Retry
                        </button>
                        <button 
                          onClick={forceRefreshFeed} 
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                        >
                          Force Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feed Posts */}
                {posts && posts.length > 0 ? (
                  posts.map((post: any, index: number) => {
                    // Debug logging for all posts
                    console.log(`Post ${index + 1}:`, {
                      id: post.id,
                      author: post.author,
                      content: post.content,
                      contentLength: post.content?.length || 0,
                      isRepost: post.isRepost,
                      hasOriginalPost: !!post.originalPost,
                      originalPostAuthor: post.originalPost?.author,
                      willRender: !!(post.id && post.author && (post.content || post.isRepost))
                    });
                    
                    // Debug logging for reposts
                    if (post.isRepost) {
                      console.log('✅ REPOST DETECTED:', {
                        id: post.id,
                        author: post.author,
                        content: `"${post.content}"`,
                        contentEmpty: !post.content,
                        isRepost: post.isRepost,
                        originalPost: post.originalPost,
                        willRender: !!(post.id && post.author && (post.content || post.isRepost))
                      });
                    } else if (post.originalPost) {
                      console.log('⚠️ HAS ORIGINAL POST BUT isRepost=false:', {
                        id: post.id,
                        author: post.author,
                        isRepost: post.isRepost,
                        originalPost: post.originalPost
                      });
                    }
                    
                    return post.id && post.author && (post.content || post.isRepost) ? (
                      <div key={post.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                        <PostCard
                          id={post.id}
                          author={post.author}
                          role={post.role}
                          content={post.content}
                          likes={post.likes}
                          comments={post.comments}
                          shares={post.shares || 0}
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
                          isRepost={post.isRepost || false}
                          isVerified={post.isVerified}
                          originalPost={post.originalPost}
                        />
                      </div>
                    ) : null;
                  })
                ) : null}

                {/* Infinite scroll loader */}
                <div ref={loaderRef} className="flex justify-center -mb-4 lg:mb-0">
                  {loading && posts.length > 0 && (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 py-4"></div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 text-sm mb-0 pb-0">
                      You have reached end of feed
                    </div>
                  )}
                </div>

                {/* Empty feed message */}
                {!loading && !error && posts.length === 0 && (
                  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {activeFilter === 'following' ? 'No posts from people you follow' : 'No posts yet'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {activeFilter === 'following' ? 'Follow people to see their posts in your feed' : 'Be the first to share something with your network!'}
                    </p>
                    <Button onClick={() => document.getElementById('post-input')?.focus()}>
                      Create your first post
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 order-3 space-y-6 hidden lg:block">
              
              {/* Industry News */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <NewspaperIcon className="w-4 h-4 text-blue-500" />
                      News
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">Live</span>
                  </div>
                </div>
                <div className="space-y-0 max-h-80 overflow-y-auto">
                  {newsLoading ? (
                    <div className="p-4 flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : newsError ? (
                    <div className="p-4 text-center text-red-500">Error loading news</div>
                  ) : !news || news.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">No news available</div>
                  ) : (
                    news.map((article: any, index: number) => (
                      <div key={index} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0 group" onClick={() => article?.id && router.push(`/news/${article.id}`)}>
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-2 group-hover:text-[#0BC0DF] transition-colors">
                              {article?.title || 'Untitled'}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                  {article?.company?.name || 'Company'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {article?.timeAgo || 'Recently'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => router.push('/news')} className="w-full text-sm font-medium text-[#0BC0DF] hover:text-[#0aa9c4] transition-colors flex items-center justify-center gap-2">
                    <NewspaperIcon className="w-4 h-4" />
                    View all news
                  </button>
                </div>
              </div>

              {/* Sticky Container for People You May Know */}
              <div className="lg:sticky lg:top-[72px] space-y-6">
                
                {/* People You May Know */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">People You May Know</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {suggestedUsersLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#0BC0DF]"></div>
                      </div>
                    ) : suggestedUsersError ? (
                      <div className="text-center text-red-500 text-sm py-4">Error loading suggestions</div>
                    ) : suggestedUsers.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">No suggestions available</div>
                    ) : (
                      suggestedUsers.slice(0, 5).map((person: any, index: number) => (
                        <div key={`${person.id}-${index}`} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors group" onClick={() => router.push(`/profile/${person.id}`)}>
                          <div className="w-10 h-10 rounded-full bg-[#E6F7FC] dark:bg-[#0a4d5c] flex items-center justify-center text-[#0BC0DF] font-semibold text-sm overflow-hidden flex-shrink-0">
                            {person.profileImage ? (
                              <Image 
                                src={person.profileImage} 
                                alt={person.name} 
                                width={40} 
                                height={40} 
                                className="w-full h-full object-cover rounded-full" 
                              />
                            ) : (
                              <span>{person.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate flex items-center gap-1">
                              <span>{person.name}</span>
                              <VerificationBadge isVerified={person.isVerified} size="sm" />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {person.role}{person.company && ` • ${person.company}`}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => router.push('/network')} className="w-full text-sm font-medium text-[#0BC0DF] hover:text-[#0aa9c4] transition-colors">
                      See all
                    </button>
                  </div>
                </div>

                {/* Footer Links - Hidden on Mobile */}
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2 p-4 hidden md:block">
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