import { useState, useEffect } from 'react';
import { newsApi, NewsArticle } from '@/lib/api';

interface UseNewsReturn {
  news: NewsArticle[];
  loading: boolean;
  error: string | null;
  refreshNews: () => Promise<void>;
}

export const useNews = (enabled: boolean = true, limit: number = 5): UseNewsReturn => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await newsApi.getAllNews(1, limit);
      
      if (response.data?.news) {
        setNews(response.data.news);
      } else {
        setNews([]);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    await fetchNews();
  };

  useEffect(() => {
    if (enabled) {
      fetchNews();
    }
  }, [enabled, limit]);

  // Listen for news updates from other parts of the app
  useEffect(() => {
    const handleNewsUpdate = () => {
      fetchNews();
    };

    window.addEventListener('newsUpdated', handleNewsUpdate);
    
    return () => {
      window.removeEventListener('newsUpdated', handleNewsUpdate);
    };
  }, []);

  return {
    news,
    loading,
    error,
    refreshNews,
  };
};