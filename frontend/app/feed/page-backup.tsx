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
    posts, loading, error, fetchFeed, loadMore, hasMore, createPost, likePost, repostPost, deletePost, commentOnPost, deleteComment
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
    try { await repostPost(postId, repostComment); } catch (err) { alert('Failed to repost'); }
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
    try { if (commentText) await commentOnPost(postId, commentText); } catch (err) { alert('Failed to add comment'); }
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
      <div className="w-full flex justify-center px-4 lg:px-6 pb-8 pt-6">
        <div className="w-full lg:w-[1200px]">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left Sidebar */}
            <div className="lg:col-span-1 order-1">
              <div className="lg:sticky lg:top-[72px] space-y-6">
                
                {/* User Profile Card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
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
                <div className="hidden md:block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
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

            {/* Main Feed */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Filter Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      activeFilter === 'all'
                        ? 'text-[#0BC0DF] border-b-2 border-[#0BC0DF] bg-cyan-50 dark:bg-cyan-900/20'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    All Posts
                  </button>
                  <button
                    onClick={() => setActiveFilter('following')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      activeFilter === 'following'
                        ? 'text-[#0BC0DF] border-b-2 border-[#0BC0DF] bg-cyan-50 dark:bg-cyan-900/20'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Following
                  </button>
                </div>
              </div>

              {/* Create Post */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    {currentUser?.profileImage ? (
                      <Image
                        src={currentUser.profileImage}
                        alt={currentUser.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {currentUser ? getUserInitials(currentUser.name || 'User') : 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-[#0BC0DF] focus:border-transparent dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                    
                    {/* File Preview */}
                    {previewUrls.length > 0 && (
                      <div className="mt-3">
                        {selectedFiles[0]?.type.startsWith('video/') ? (
                          <CustomVideoPlayer src={previewUrls[0]} />
                        ) : (
                          <Image
                            src={previewUrls[0]}
                            alt="Preview"
                            width={400}
                            height={300}
                            className="rounded-lg object-cover max-h-64"
                          />
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex space-x-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <Button variant="outline" size="sm" type="button">
                            <PhotoIcon className="w-4 h-4 mr-1" />
                            Photo
                          </Button>
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <Button variant="outline" size="sm" type="button">
                            <VideoCameraIcon className="w-4 h-4 mr-1" />
                            Video
                          </Button>
                        </label>
                      </div>
                      <Button 
                        onClick={handleCreatePost}
                        disabled={isPosting || (!postContent.trim() && selectedFiles.length === 0)}
                        className="bg-[#0BC0DF] hover:bg-cyan-600"
                      >
                        {isPosting ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              <Suspense fallback={<StreamingFeedLoader count={3} />}>
                {loading && posts.length === 0 && (
                  <StreamingFeedLoader count={3} />
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Something went wrong</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Unable to load posts</p>
                    <div className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</div>
                    <button onClick={() => fetchFeed(1, true)} className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-sm rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors">Retry</button>
                  </div>
                )}

                {/* Posts */}
                {posts && posts.length > 0 ? (
                  posts.map((post: any, index: number) => {
                    return post.id && post.author && post.content ? (
                      <div key={post.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                        <PostCard
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
                          currentUserId={currentUser?.id}
                          postAuthorId={post.authorId}
                          profileImage={post.profileImage}
                          onLike={() => handleLike(post.id)}
                          onComment={(postId, commentText) => handleComment(postId, commentText)}
                          onShare={() => {}}
                          onRepost={(postId, comment) => handleRepost(postId, comment)}
                          onSave={() => handleSave(post.id)}
                          onDelete={() => handleDelete(post.id)}
                          onDeleteComment={(postId, commentId) => handleDeleteComment(postId, commentId)}
                          isLiked={post.isLiked}
                          isSaved={isPostSaved(post.id)}
                          isRepost={post.originalPost ? true : false}
                          isVerified={post.isVerified}
                          originalPost={post.originalPost}
                        />
                      </div>
                    ) : null;
                  })
                ) : null}

                {/* Load More */}
                {loading && posts.length > 0 && (
                  <StreamingFeedLoader count={1} />
                )}

                {/* End of Feed */}
                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    You've reached the end of your feed
                  </div>
                )}

                {/* Empty State */}
                {!loading && !error && posts.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No posts yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">Be the first to share something!</p>
                  </div>
                )}
              </Suspense>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              {/* News Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Latest News</h3>
                  <NewspaperIcon className="w-5 h-5 text-gray-400" />
                </div>
                {newsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : newsError ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unable to load news</p>
                ) : news && news.length > 0 ? (
                  <div className="space-y-3">
                    {news.slice(0, 5).map((article: any, index: number) => (
                      <div key={index} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                          {article.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {article.source} • {article.publishedAt}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No news available</p>
                )}
              </div>

              {/* Suggested Connections */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">People You May Know</h3>
                {suggestedUsersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center space-x-3 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : suggestedUsersError ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unable to load suggestions</p>
                ) : suggestedUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No suggestions available</p>
                ) : (
                  <div className="space-y-3">
                    {suggestedUsers.slice(0, 5).map((person: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          {person.profileImage ? (
                            <Image
                              src={person.profileImage}
                              alt={person.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {getUserInitials(person.name)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {person.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {person.role} at {person.company}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}