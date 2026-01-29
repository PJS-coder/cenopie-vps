import { useState, useEffect, useCallback, useRef } from 'react';
import { feedApi } from '@/lib/api';

export interface FeedPost {
  id: string;
  author: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  commentDetails?: {
    id: string;
    author: string;
    authorId?: string;
    profileImage?: string;
    text: string;
    createdAt: string;
  }[];
  shares: number;
  timestamp: string;
  image?: string;
  mediaType?: 'image' | 'video' | 'article';
  isConnected?: boolean;
  isRepost?: boolean;
  originalPost?: FeedPost;
  authorId?: string;
  profileImage?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  isVerified?: boolean;
}

interface UseFeedProps {
  filter?: 'all' | 'following';
}

// Simple cache to prevent unnecessary API calls
let feedCache: { [key: string]: { data: FeedPost[]; timestamp: number; page: number } } = {};
const CACHE_DURATION = 30 * 1000; // Reduced to 30 seconds for better repost visibility

export const useFeed = ({ filter = 'all' }: UseFeedProps = {}) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const cacheKey = `feed-${filter}`;
  
  // Helper function to ensure posts array has unique IDs (simplified)
  const ensureUniquePosts = useCallback((postsArray: FeedPost[]): FeedPost[] => {
    if (!Array.isArray(postsArray)) return [];
    
    const seen = new Set<string>();
    return postsArray.filter(post => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, []);

  // Function to update posts state with deduplication
  const updatePostsSafely = useCallback((updater: (prev: FeedPost[]) => FeedPost[]) => {
    setPosts(prev => {
      const updated = updater(prev);
      const deduplicated = ensureUniquePosts(updated);
      return deduplicated;
    });
  }, [ensureUniquePosts]);

  const fetchFeed = useCallback(async (pageNum = 1, forceRefresh = false) => {
    if (loading && !forceRefresh) {
      return;
    }
    
    try {
      setLoading(pageNum === 1);
      setError(null);
      
      // Check cache first for page 1
      if (pageNum === 1 && !forceRefresh && feedCache[cacheKey] && 
          Date.now() - feedCache[cacheKey].timestamp < CACHE_DURATION) {
        setPosts(feedCache[cacheKey].data);
        setHasMore(feedCache[cacheKey].data.length >= 10);
        setLoading(false);
        return;
      }
      
      console.log('=== FETCHING FEED ===');
      console.log('Page:', pageNum, 'Filter:', filter);
      
      const response: any = await feedApi.getFeed(filter, pageNum);
      console.log('Feed API response:', response);
      
      if (response && response.success && response.data) {
        const feedData = Array.isArray(response.data) ? response.data : [];
        console.log('Feed data received:', feedData.length, 'posts');
        console.log('Reposts in feed:', feedData.filter((p: any) => p.isRepost).length);
        
        const transformedPosts = feedData.map((post: any) => ({
          id: post.id,
          author: post.author,
          role: post.role,
          content: post.content,
          likes: post.likes,
          comments: post.comments,
          commentDetails: post.commentDetails || [],
          shares: post.shares || 0,
          timestamp: post.timestamp,
          image: post.image,
          mediaType: post.mediaType,
          isConnected: post.isConnected,
          authorId: post.authorId,
          profileImage: post.profileImage,
          isLiked: post.isLiked,
          isVerified: post.isVerified,
          isRepost: post.isRepost || false, // Ensure this is properly set
          originalPost: post.originalPost
        }));
        
        console.log('Transformed posts:', transformedPosts.length);
        console.log('Reposts after transform:', transformedPosts.filter((p: FeedPost) => p.isRepost).length);
        
        if (pageNum === 1) {
          setPosts(transformedPosts);
          // Update cache
          feedCache[cacheKey] = { 
            data: transformedPosts, 
            timestamp: Date.now(), 
            page: 1 
          };
        } else {
          setPosts(prev => [...prev, ...transformedPosts]);
        }
        
        setHasMore(response.pagination?.hasMore || transformedPosts.length === 10);
      } else {
        console.error('Invalid feed response format:', response);
        throw new Error('Invalid response format from feed API');
      }
    } catch (err) {
      console.error('=== FETCH FEED ERROR ===');
      console.error('fetchFeed error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feed');
      if (pageNum === 1) setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filter, loading, cacheKey]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchFeed(page + 1, true);
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading, page, fetchFeed]);

  // Force refresh function to clear all caches and reload feed
  const forceRefreshFeed = useCallback(async () => {
    console.log('🔄 FORCE REFRESHING FEED...');
    
    // Clear all caches
    feedCache = {};
    
    // Clear browser cache for API calls
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('🗑️ Cleared browser caches');
      } catch (error) {
        console.warn('Could not clear browser caches:', error);
      }
    }
    
    // Reset state
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    
    // Fetch fresh data
    await fetchFeed(1, true);
    
    console.log('✅ Feed force refresh complete');
  }, [fetchFeed]);

  const createPost = async (content: string, image?: string, mediaType?: string) => {
    try {
      const postData: { content: string; image?: string; mediaType?: string } = { content };
      if (image) postData.image = image;
      if (mediaType) postData.mediaType = mediaType;
      
      const response: any = await feedApi.createPost(postData);
      
      if (response.data) {
        // Clear ALL cache when new post is created
        feedCache = {};
        console.log('🗑️ Cleared all feed cache after post creation');
        
        // Transform the new post to match our FeedPost interface
        const newPost = {
          id: response.data._id || response.data.id,
          author: response.data.author?.name || response.data.author || 'Unknown User',
          role: response.data.author?.headline || response.data.author?.role || response.data.role || 'Professional',
          content: response.data.content,
          likes: response.data.likes?.length || response.data.likes || 0,
          comments: response.data.comments?.length || response.data.comments || 0,
          shares: response.data.shares || 0,
          timestamp: response.data.timestamp || new Date(response.data.createdAt || Date.now()).toLocaleDateString(),
          image: response.data.image,
          mediaType: response.data.mediaType,
          isConnected: response.data.isConnected || false,
          authorId: response.data.author?._id || response.data.author?.id || response.data.authorId,
          profileImage: response.data.author?.profileImage || response.data.profileImage,
          isLiked: response.data.isLiked || true,
          isVerified: response.data.author?.isVerified || response.data.isVerified || false,
          isRepost: response.data.isRepost || false,
          originalPost: response.data.originalPost || null
        };
        
        // Force refresh the feed to show the new post
        await fetchFeed(1, true);
        
        return response.data;
      }
    } catch (err) {
      console.error('Create post error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
      throw err;
    }
  };

  const likePost = async (postId: string) => {
    // Optimistically update UI first
    updatePostsSafely(prev => {
      if (!Array.isArray(prev)) return prev || [];
      
      return prev.map(post => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          const newLikes = newIsLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
          return { ...post, isLiked: newIsLiked, likes: newLikes };
        }
        return post;
      });
    });

    // Then make API call
    try {
      const response = await feedApi.likePost(postId);
      
      // Update with server response if available
      if (response && response.data) {
        const serverData = response.data;
        updatePostsSafely(prev => {
          if (!Array.isArray(prev)) return prev || [];
          
          return prev.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                likes: typeof serverData.likes === 'number' ? serverData.likes : (serverData.likes?.length || post.likes),
                isLiked: serverData.isLiked !== undefined ? serverData.isLiked : post.isLiked
              };
            }
            return post;
          });
        });
      }
    } catch (err) {
      // Revert optimistic update on error
      updatePostsSafely(prev => {
        if (!Array.isArray(prev)) return prev || [];
        
        return prev.map(post => {
          if (post.id === postId) {
            const revertedIsLiked = !post.isLiked;
            const revertedLikes = revertedIsLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
            return { ...post, isLiked: revertedIsLiked, likes: revertedLikes };
          }
          return post;
        });
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to like post';
      setError(errorMessage);
      console.error('Like post failed:', errorMessage);
    }
  };

  const loadPostComments = async (postId: string) => {
    try {
      // Check if user is still authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('User not authenticated, skipping comment loading');
        return null;
      }

      console.log(`Loading comments for post ${postId}`);
      const response: any = await feedApi.getPostById(postId);
      
      if (response.data) {
        console.log('Loaded post with comments:', response.data);
        console.log('Comment details:', response.data.commentDetails);
        
        // Update the specific post with full comment details
        updatePostsSafely(prev => {
          if (!Array.isArray(prev)) {
            console.error('Posts array is not valid:', prev);
            return prev || [];
          }
          
          const updated = prev.map(post => {
            if (post.id === postId) {
              console.log(`Updating post ${postId} with loaded comments`);
              return {
                ...post,
                commentDetails: response.data.commentDetails || [],
                comments: response.data.comments || post.comments
              };
            }
            return post;
          });
          
          return updated;
        });
        
        return response.data;
      }
    } catch (err) {
      // Only log error and set error state if user is still authenticated
      const token = localStorage.getItem('authToken');
      if (token) {
        console.error('Failed to load post comments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load comments');
      }
      throw err;
    }
  };

  const commentOnPost = async (postId: string, text: string) => {
    try {
      // Check if user is still authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('User not authenticated, skipping comment submission');
        return null;
      }

      const response: any = await feedApi.commentOnPost(postId, text);
      console.log('Comment API response:', response);
      
      if (response.data) {
        // Update the post in the feed
        updatePostsSafely(prev => {
          console.log(`Updating post ${postId} after comment`);
          console.log('Response data:', response.data);
          console.log('Response commentDetails:', response.data.commentDetails);
          
          if (!Array.isArray(prev)) {
            console.error('Posts array is not valid:', prev);
            return prev || [];
          }
          
          const updated = prev.map(post => {
            if (post.id === postId) {
              console.log(`Found post ${postId} to update`);
              console.log('Current post commentDetails:', post.commentDetails);
              console.log('New commentDetails from response:', response.data.commentDetails);
              
              const updatedPost = {
                ...post,
                comments: response.data.comments || post.comments,
                commentDetails: response.data.commentDetails || post.commentDetails || [],
                authorId: post.authorId || response.data.author?._id || response.data.author?.id || response.data.authorId
              };
              
              console.log('Updated post commentDetails:', updatedPost.commentDetails);
              return updatedPost;
            }
            return post;
          });
          
          console.log('Updated posts array:', updated);
          return updated;
        });
        return response.data;
      }
    } catch (err) {
      // Only log error and set error state if user is still authenticated
      const token = localStorage.getItem('authToken');
      if (token) {
        console.error('Comment submission error:', err);
        setError(err instanceof Error ? err.message : 'Failed to comment on post');
      }
      throw err;
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      console.log(`Deleting comment ${commentId} from post ${postId}`);
      const response: any = await feedApi.deleteComment(postId, commentId);
      if (response.data) {
        // Add a small delay to ensure cache invalidation has completed
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Update the post in the feed
        updatePostsSafely(prev => {
          console.log(`Updating post ${postId} after comment deletion`);
          const updated = prev.map(post => {
            if (post.id === postId) {
              console.log(`Found post ${postId} to update comments from ${post.comments} to`, 
                (response.data as any).comments?.length || (response.data as any).comments || post.comments);
              return {
                ...post,
                comments: (response.data as any).comments?.length || (response.data as any).comments || post.comments,
                commentDetails: (response.data as any).commentDetails || post.commentDetails || [],
                authorId: post.authorId || (response.data as any).author?._id || (response.data as any).author?.id || (response.data as any).authorId
              };
            }
            return post;
          });
          return updated;
        });
        
        console.log(`Successfully deleted comment ${commentId} from post ${postId}`);
        return response.data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      // Re-throw the error so the caller can handle it
      throw err;
    }
  };

  const repostPost = async (postId: string, repostComment?: string) => {
    try {
      console.log('=== FRONTEND REPOST START ===');
      console.log('Post ID:', postId);
      console.log('Repost comment:', repostComment);
      
      const response: any = await feedApi.repostPost(postId, repostComment);
      console.log('Repost API response:', response);
      
      if (response && response.success && response.data) {
        console.log('Repost response data:', response.data);
        console.log('isRepost from response:', response.data.isRepost);
        console.log('originalPost from response:', response.data.originalPost);
        
        // Transform the reposted post to match our FeedPost interface
        const repostedPost: FeedPost = {
          id: response.data.id,
          author: response.data.author,
          role: response.data.role,
          content: response.data.content,
          likes: response.data.likes,
          comments: response.data.comments,
          commentDetails: response.data.commentDetails || [],
          shares: response.data.shares || 0,
          timestamp: response.data.timestamp,
          image: response.data.image,
          mediaType: response.data.mediaType,
          isConnected: response.data.isConnected,
          authorId: response.data.authorId,
          profileImage: response.data.profileImage,
          isLiked: response.data.isLiked,
          isVerified: response.data.isVerified,
          isRepost: response.data.isRepost, // This should be true
          originalPost: response.data.originalPost ? {
            id: response.data.originalPost.id,
            author: response.data.originalPost.author,
            role: response.data.originalPost.role,
            content: response.data.originalPost.content,
            likes: response.data.originalPost.likes,
            comments: response.data.originalPost.comments,
            commentDetails: response.data.originalPost.commentDetails || [],
            shares: response.data.originalPost.shares,
            timestamp: response.data.originalPost.timestamp,
            image: response.data.originalPost.image,
            mediaType: response.data.originalPost.mediaType,
            isConnected: response.data.originalPost.isConnected,
            authorId: response.data.originalPost.authorId,
            profileImage: response.data.originalPost.profileImage,
            isLiked: response.data.originalPost.isLiked,
            isVerified: response.data.originalPost.isVerified
          } : undefined
        };
        
        console.log('Transformed repost:', repostedPost);
        console.log('Repost isRepost:', repostedPost.isRepost);
        console.log('Repost originalPost:', repostedPost.originalPost);
        
        // Clear ALL cache when repost is created
        feedCache = {};
        console.log('🗑️ Cleared all feed cache');
        
        // Force refresh the entire feed to ensure reposts show up
        console.log('🔄 Force refreshing feed...');
        await forceRefreshFeed();
        
        console.log('=== FRONTEND REPOST SUCCESS ===');
        return response.data;
      } else {
        throw new Error('Invalid response format from repost API');
      }
    } catch (err) {
      console.error('=== FRONTEND REPOST ERROR ===');
      console.error('Repost error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to repost post';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await feedApi.deletePost(postId);
      // Remove the post from the feed immediately for better UX
      console.log(`Deleting post with ID: ${postId}`);
      updatePostsSafely(prev => {
        if (!Array.isArray(prev)) {
          console.error('Posts array is not valid:', prev);
          return prev || [];
        }
        const filtered = prev.filter(post => post.id !== postId);
        console.log(`Removed post ${postId}, remaining posts:`, filtered);
        return filtered;
      });
    } catch (err) {
      console.error('Failed to delete post:', err);
      // Show a more user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete post';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    // Reset state when filter changes
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    
    // Check cache first
    if (feedCache[cacheKey] && Date.now() - feedCache[cacheKey].timestamp < CACHE_DURATION) {
      setPosts(feedCache[cacheKey].data);
      setHasMore(feedCache[cacheKey].data.length >= 10);
      setLoading(false);
      return;
    }
    
    // Fetch new data immediately
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('=== INITIAL FEED FETCH ===');
        console.log('Filter:', filter);
        
        const response: any = await feedApi.getFeed(filter, 1);
        console.log('Initial feed response:', response);
        
        if (response && response.success && response.data) {
          const feedData = Array.isArray(response.data) ? response.data : [];
          console.log('Initial feed data:', feedData.length, 'posts');
          
          if (feedData.length > 0) {
            const transformedPosts = feedData.map((post: any) => ({
              id: post.id,
              author: post.author,
              role: post.role,
              content: post.content,
              likes: post.likes,
              comments: post.comments,
              commentDetails: post.commentDetails || [],
              shares: post.shares || 0,
              timestamp: post.timestamp,
              image: post.image,
              mediaType: post.mediaType,
              isConnected: post.isConnected,
              authorId: post.authorId,
              profileImage: post.profileImage,
              isLiked: post.isLiked,
              isVerified: post.isVerified,
              isRepost: post.isRepost || false, // Ensure this is properly set
              originalPost: post.originalPost
            }));
            
            console.log('Initial transformed posts:', transformedPosts.length);
            console.log('Initial reposts:', transformedPosts.filter((p: FeedPost) => p.isRepost).length);
            
            setPosts(transformedPosts);
            setHasMore(response.pagination?.hasMore || transformedPosts.length === 10);
            
            // Update cache
            feedCache[cacheKey] = { 
              data: transformedPosts, 
              timestamp: Date.now(), 
              page: 1 
            };
          } else {
            setPosts([]);
            setHasMore(false);
          }
        } else {
          console.error('Invalid initial feed response:', response);
          setPosts([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error('=== INITIAL FEED FETCH ERROR ===');
        console.error('Initial feed fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch feed');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filter, cacheKey]);
  
  return {
    posts,
    loading,
    error,
    hasMore,
    fetchFeed,
    loadMore,
    forceRefreshFeed,
    createPost,
    likePost,
    loadPostComments,
    commentOnPost,
    deleteComment,
    repostPost,
    deletePost,
  };
};