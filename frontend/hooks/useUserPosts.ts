import { useState, useEffect, useCallback } from 'react';
import { feedApi } from '@/lib/api';

export interface UserPost {
  id: string;
  author: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  image?: string;
  mediaType?: 'image' | 'video' | 'article';
  isConnected?: boolean;
  originalPost?: UserPost;
  authorId?: string;
  profileImage?: string;
}

export const useUserPosts = (userId: string) => {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchUserPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await feedApi.getUserPosts(userId);
      
      // Ensure we have an array, even if the response is empty or malformed
      const postsData = Array.isArray(response.data) ? response.data : [];
      
      setPosts(postsData);
      
      // For now, we'll show all posts at once since API doesn't support pagination
      setHasMore(false);
      
    } catch (err) {
      console.error('User posts fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMore = async () => {
    // Since API doesn't support pagination, this is a no-op
  };

  useEffect(() => {
    if (userId) {
      setPage(1);
      setHasMore(false);
      fetchUserPosts();
    }
  }, [userId, fetchUserPosts]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: fetchUserPosts,
  };
};