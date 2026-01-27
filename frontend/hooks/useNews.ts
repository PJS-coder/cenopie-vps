import { useState, useEffect } from 'react';
import { newsApi, NewsArticle } from '@/lib/api';

interface UseNewsReturn {
  news: NewsArticle[];
  loading: boolean;
  error: string | null;
  refreshNews: () => Promise<void>;
}

// Simple cache to prevent unnecessary API calls
let newsCache: { data: NewsArticle[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useNews = (enabled: boolean = true, limit: number = 5): UseNewsReturn => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      if (newsCache && Date.now() - newsCache.timestamp < CACHE_DURATION) {
        setNews(newsCache.data);
        setLoading(false);
        return;
      }
      
      const response = await newsApi.getAllNews(1, limit);
      
      if (response.data?.news) {
        const newsData = response.data.news;
        setNews(newsData);
        // Update cache
        newsCache = { data: newsData, timestamp: Date.now() };
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
    // Clear cache on manual refresh
    newsCache = null;
    await fetchNews();
  };

  useEffect(() => {
    if (enabled) {
      fetchNews();
    } else {
      setLoading(false);
    }
  }, [enabled, limit]);

  // Listen for news updates from other parts of the app
  useEffect(() => {
    const handleNewsUpdate = () => {
      newsCache = null; // Clear cache
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