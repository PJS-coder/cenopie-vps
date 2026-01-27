import { useState, useEffect } from 'react';
import { profileApi } from '@/lib/api';

export interface SuggestedUser {
  id: string;
  name: string;
  role: string;
  company: string;
  profileImage?: string;
  isVerified?: boolean;
  connected: boolean;
}

// Simple cache to prevent unnecessary API calls
let suggestedUsersCache: { data: SuggestedUser[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const useSuggestedUsers = (enabled: boolean = true) => {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      if (suggestedUsersCache && Date.now() - suggestedUsersCache.timestamp < CACHE_DURATION) {
        setUsers(suggestedUsersCache.data);
        setLoading(false);
        return;
      }
      
      const response = await profileApi.getSuggestedUsers();
      
      // Handle different response formats
      let usersData = [];
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && Array.isArray((response.data as any).users)) {
        usersData = (response.data as any).users;
      } else if (Array.isArray((response as any).users)) {
        usersData = (response as any).users;
      } else if (Array.isArray(response)) {
        usersData = response;
      }
      
      // Validate that each user has required fields
      const validUsers = usersData.filter((user: any) => 
        user.id && user.name && (user.role || user.headline)
      );
      
      setUsers(validUsers);
      // Update cache
      suggestedUsersCache = { data: validUsers, timestamp: Date.now() };
    } catch (err) {
      console.error('Suggested users fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggested users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchSuggestedUsers();
    } else {
      setLoading(false);
    }
  }, [enabled]);

  return {
    users,
    loading,
    error,
    refetch: fetchSuggestedUsers,
  };
};