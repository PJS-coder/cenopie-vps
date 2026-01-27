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
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for feed data

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
      
      const response: any = await feedApi.getFeed(filter, pageNum);
      
      if (response && response.data) {
        const feedData = Array.isArray(response.data) ? response.data : [];
        
        const transformedPosts = feedData.map((post: any) => ({
          id: post.id || post._id,
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
          originalPost: post.originalPost
        }));
        
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
      }
    } catch (err) {
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

  const createPost = async (content: string, image?: string, mediaType?: string) => {
    try {
      const postData: { content: string; image?: string; mediaType?: string } = { content };
      if (image) postData.image = image;
      if (mediaType) postData.mediaType = mediaType;
      
      const response: any = await feedApi.createPost(postData);
      
      if (response.data) {
        // Clear cache when new post is created
        delete feedCache[cacheKey];
        
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
        
        // Add the new post to the beginning of the feed, ensuring no duplicates
        updatePostsSafely(prev => {
          const existingIndex = prev.findIndex(post => post.id === newPost.id);
          if (existingIndex >= 0) {
            const updatedPosts = [...prev];
            updatedPosts[existingIndex] = newPost;
            return updatedPosts;
          } else {
            return [newPost, ...prev];
          }
        });
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

  const commentOnPost = async (postId: string, text: string) => {
    try {
      const response: any = await feedApi.commentOnPost(postId, text);
      if (response.data) {
        // Update the post in the feed
        updatePostsSafely(prev => {
          console.log(`Updating post ${postId} after comment`);
          if (!Array.isArray(prev)) {
            console.error('Posts array is not valid:', prev);
            return prev || [];
          }
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
        return response.data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to comment on post');
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
      const response: any = await feedApi.repostPost(postId, repostComment);
      if (response && response.data) {
        // Transform the reposted post to match our FeedPost interface
        const repostedPost = {
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
          authorId: (response.data.author && response.data.author._id) || 
                    (response.data.author && response.data.author.id) || 
                    response.data.authorId || null,
          profileImage: response.data.author?.profileImage || response.data.profileImage || null,
          isLiked: response.data.isLiked || true,
          isVerified: response.data.author?.isVerified || response.data.isVerified || false,
          isRepost: response.data.isRepost || false,
          originalPost: response.data.originalPost || null
        };
        
        console.log('New repost to be added:', repostedPost);
        
        // Add the new repost to the beginning of the feed, ensuring no duplicates
        updatePostsSafely(prev => {
          // Check if post already exists
          const existingIndex = prev.findIndex(post => post.id === repostedPost.id);
          console.log('Existing repost index:', existingIndex);
          if (existingIndex >= 0) {
            // If it exists, replace it
            console.log('Replacing existing repost with ID:', repostedPost.id);
            const updatedPosts = [...prev];
            updatedPosts[existingIndex] = repostedPost;
            return updatedPosts;
          } else {
            // If it doesn't exist, add it to the beginning
            console.log('Adding new repost with ID:', repostedPost.id);
            return [repostedPost, ...prev];
          }
        });
        return response.data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to repost post');
      throw err;
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
        
        const response: any = await feedApi.getFeed(filter, 1);
        
        if (response && response.data) {
          const feedData = Array.isArray(response.data) ? response.data : [];
          
          if (feedData.length > 0) {
            const transformedPosts = feedData.map((post: any) => ({
              id: post.id || post._id,
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
              originalPost: post.originalPost
            }));
            
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
          setPosts([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error('Feed fetch error:', err);
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
    createPost,
    likePost,
    commentOnPost,
    deleteComment,
    repostPost,
    deletePost,
  };
};