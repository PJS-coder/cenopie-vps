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

export const useFeed = ({ filter = 'all' }: UseFeedProps = {}) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Add refs for debouncing
  const fetchFeedRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Removed console.log for better performance
  
  // Helper function to ensure posts array has unique IDs
  const ensureUniquePosts = useCallback((postsArray: FeedPost[]): FeedPost[] => {
    const uniquePostsMap = new Map<string, FeedPost>();
    postsArray.forEach(post => {
      // If we already have a post with this ID, we'll keep the newer one
      if (!uniquePostsMap.has(post.id) || 
          (post.timestamp && uniquePostsMap.get(post.id)?.timestamp && 
           new Date(post.timestamp) > new Date(uniquePostsMap.get(post.id)!.timestamp))) {
        uniquePostsMap.set(post.id, post);
      }
    });
    return Array.from(uniquePostsMap.values());
  }, []);

  // Function to update posts state with deduplication
  const updatePostsSafely = useCallback((updater: (prev: FeedPost[]) => FeedPost[]) => {
    setPosts(prev => {
      const updated = updater(prev);
      const deduplicated = ensureUniquePosts(updated);
      // Posts updated for better performance
      return deduplicated;
    });
  }, [ensureUniquePosts]);

  const fetchFeed = useCallback(async (pageNum = 1, forceRefresh = false) => {
    console.log(`fetchFeed called: pageNum=${pageNum}, forceRefresh=${forceRefresh}, filter=${filter}, postsLength=${posts.length}`);
    
    // Only allow manual refresh or initial load
    if (!forceRefresh && pageNum === 1 && posts.length > 0) {
      console.log('❌ Auto-refresh BLOCKED - use manual refresh button');
      return;
    }
    
    console.log('✅ Proceeding with fetch');
    
    // Clear any existing timeouts
    if (fetchFeedRef.current) {
      clearTimeout(fetchFeedRef.current);
    }
    
    // Fetch immediately - no debouncing or cooldowns
    return performFetchFeed(pageNum);
  }, [filter]); // Add filter as dependency
  
  const performFetchFeed = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      setError(null);
      const response: any = await feedApi.getFeed(filter, pageNum);
      // Ensure we have an array, even if the response is empty or malformed
      const feedData = Array.isArray(response.data) ? response.data : [];
      
      // Transform the feed data to match our FeedPost interface
      const transformedPosts = feedData.map((post: any) => ({
        id: post._id || post.id,
        author: post.author?.name || post.author || 'Unknown User',
        role: post.author?.headline || post.author?.role || post.role || 'Professional',
        content: post.content,
        likes: post.likes?.length || post.likes || 0,
        comments: post.comments?.length || post.comments || 0,
        commentDetails: post.commentDetails || post.comments?.map((comment: any) => ({
          id: comment._id || comment.id,
          author: comment.author?.name || comment.author || 'Unknown User',
          authorId: comment.author?._id || comment.authorId || undefined, // Add authorId
          profileImage: comment.author?.profileImage || comment.profileImage || undefined,
          text: comment.text || '',
          createdAt: comment.createdAt || comment.timestamp || ''
        })) || [],
        shares: post.shares || 0,
        timestamp: post.timestamp || new Date(post.createdAt || Date.now()).toLocaleDateString(),
        image: post.image,
        mediaType: post.mediaType,
        isConnected: post.isConnected || false,
        // Debug connection status
        _debugConnection: {
          provided: post.isConnected,
          authorId: post.author?._id || post.author?.id || post.authorId,
          currentUser: 'will be logged separately'
        },
        authorId: post.author?._id || post.author?.id || post.authorId,
        profileImage: post.author?.profileImage || post.profileImage,
        isLiked: post.isLiked || false, // Add isLiked property
        isVerified: post.author?.isVerified || post.isVerified || false, // Add isVerified property
        // Add repost information
        isRepost: post.isRepost || false,
        originalPost: post.originalPost || null
      }));
      
      console.log('Transformed posts:', transformedPosts);
      console.log('Transformed post IDs:', transformedPosts.map((post: FeedPost) => post.id));
      
      // Ensure all posts have unique IDs by adding a timestamp suffix if needed
      const uniqueTransformedPosts = transformedPosts.map((post: FeedPost, index: number) => {
        // Check if there's already a post with this ID in the current batch
        const duplicateIndex = transformedPosts.findIndex((p: FeedPost, i: number) => i < index && p.id === post.id);
        if (duplicateIndex >= 0) {
          // Create a unique ID by appending timestamp
          const uniqueId = `${post.id}-${Date.now()}-${index}`;
          console.log(`Found duplicate post ID ${post.id}, creating unique ID:`, uniqueId);
          return {
            ...post,
            id: uniqueId
          };
        }
        return post;
      });
      
      console.log('Unique transformed posts:', uniqueTransformedPosts);
      console.log('Unique transformed post IDs:', uniqueTransformedPosts.map((post: FeedPost) => post.id));
      
      if (pageNum === 1) {
        // For first page, ensure no duplicates within the page itself and with existing posts
        const uniquePosts = ensureUniquePosts(uniqueTransformedPosts);
        console.log('Setting first page posts:', uniquePosts);
        setPosts(uniquePosts);
      } else {
        // Filter out duplicates when loading more posts
        const uniquePosts = uniqueTransformedPosts.filter(
          (newPost: FeedPost) => !posts.some(existingPost => existingPost.id === newPost.id)
        );
        console.log('Adding more posts:', uniquePosts);
        setPosts(prev => ensureUniquePosts([...prev, ...uniquePosts]));
      }
      
      // Check if there are more posts to load
      setHasMore(response.pagination?.hasMore || transformedPosts.length === 10);
    } catch (err) {
      console.error('Feed fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feed');
      // Set posts to empty array on error to avoid showing sample data
      if (pageNum === 1) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      // Clear any existing timeouts
      if (fetchFeedRef.current) {
        clearTimeout(fetchFeedRef.current);
      }
      
      // Load more immediately without debouncing
      fetchFeed(page + 1, true); // Force load more
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading, page, fetchFeed]);

  // Effect to ensure posts are always unique
  useEffect(() => {
    if (posts.length > 0) {
      // Log current posts for debugging
      console.log('Current posts in feed:', posts);
      console.log('Post IDs:', posts.map(post => post.id));
      
      const uniquePosts = ensureUniquePosts(posts);
      if (uniquePosts.length !== posts.length) {
        console.log('Duplicate posts found, removing duplicates');
        console.log('Before deduplication:', posts.length, 'posts');
        console.log('After deduplication:', uniquePosts.length, 'posts');
        // Log which posts were duplicates
        const seen = new Set();
        const duplicates = posts.filter(post => {
          if (seen.has(post.id)) {
            return true;
          }
          seen.add(post.id);
          return false;
        });
        console.log('Duplicate posts:', duplicates);
        updatePostsSafely(() => uniquePosts);
      }
    }
  }, [posts, ensureUniquePosts, updatePostsSafely]);

  const createPost = async (content: string, image?: string, mediaType?: string) => {
    try {
      const postData: { content: string; image?: string; mediaType?: string } = { content };
      if (image) postData.image = image;
      if (mediaType) postData.mediaType = mediaType;
      
      const response: any = await feedApi.createPost(postData);
      // Post created successfully
      
      if (response.data) {
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
          isLiked: response.data.isLiked || true, // The author of a post automatically likes it
          isVerified: response.data.author?.isVerified || response.data.isVerified || false, // Add isVerified property
          // Add repost information
          isRepost: response.data.isRepost || false,
          originalPost: response.data.originalPost || null
        };
        
        console.log('New post to be added:', newPost);
        console.log('Existing posts before adding new post:', posts);
        
        // Add the new post to the beginning of the feed, ensuring no duplicates
        updatePostsSafely(prev => {
          // Check if post already exists
          const existingIndex = prev.findIndex(post => post.id === newPost.id);
          console.log('Existing post index:', existingIndex);
          if (existingIndex >= 0) {
            // If it exists, replace it
            console.log('Replacing existing post with ID:', newPost.id);
            const updatedPosts = [...prev];
            updatedPosts[existingIndex] = newPost;
            return updatedPosts;
          } else {
            // If it doesn't exist, add it to the beginning
            console.log('Adding new post with ID:', newPost.id);
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
    console.log('=== LIKE POST START ===');
    console.log('Post ID:', postId);
    
    // Optimistically update UI first
    updatePostsSafely(prev => {
      if (!Array.isArray(prev)) {
        console.error('Posts array is not valid:', prev);
        return prev || [];
      }
      
      return prev.map(post => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          const newLikes = newIsLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
          
          console.log(`Optimistically updating post ${postId}:`);
          console.log(`  isLiked: ${post.isLiked} -> ${newIsLiked}`);
          console.log(`  likes: ${post.likes} -> ${newLikes}`);
          
          return {
            ...post,
            isLiked: newIsLiked,
            likes: newLikes
          };
        }
        return post;
      });
    });

    // Then make API call
    try {
      console.log('Making API call to like post...');
      const response = await feedApi.likePost(postId);
      // API response received
      
      // Update with server response if available
      if (response && response.data) {
        const serverData = response.data;
        // Updating with server data
        
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
      
      console.log('=== LIKE POST SUCCESS ===');
    } catch (err) {
      console.error('=== LIKE POST ERROR ===');
      console.error('Error details:', err);
      
      // Revert optimistic update on error
      updatePostsSafely(prev => {
        if (!Array.isArray(prev)) return prev || [];
        
        return prev.map(post => {
          if (post.id === postId) {
            const revertedIsLiked = !post.isLiked;
            const revertedLikes = revertedIsLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
            
            console.log(`Reverting post ${postId} due to error:`);
            console.log(`  isLiked: ${post.isLiked} -> ${revertedIsLiked}`);
            console.log(`  likes: ${post.likes} -> ${revertedLikes}`);
            
            return {
              ...post,
              isLiked: revertedIsLiked,
              likes: revertedLikes
            };
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
    // Fetch feed when filter changes or on initial load
    console.log(`useEffect triggered: filter=${filter}, posts.length=${posts.length}`);
    
    // Reset posts and fetch new data when filter changes
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchFeed(1, true); // Force refresh when filter changes
    
    // Cleanup timeout on unmount
    return () => {
      if (fetchFeedRef.current) {
        clearTimeout(fetchFeedRef.current);
      }
    };
  }, [filter]); // Re-run when filter changes
  
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