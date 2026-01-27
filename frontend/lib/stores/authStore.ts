import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { env } from '@/lib/config/env';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  headline?: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
  isVerified?: boolean;
  role?: string;
  company?: string;
  college?: string;
  followers?: string[];
  following?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshAuthToken: () => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

// Safe storage wrapper for SSR
const createSafeStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  
  return {
    getItem: (name: string) => {
      try {
        return localStorage.getItem(name);
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value);
      } catch (error) {
        console.warn('Failed to write to localStorage:', error);
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    },
  };
};

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setAuth: (user, token, refreshToken) => {
        set((state) => {
          state.user = user;
          state.token = token;
          state.refreshToken = refreshToken || null;
          state.isAuthenticated = true;
          state.error = null;
        });
      },

      updateUser: (updates) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, updates);
          }
        });
      },

      clearAuth: () => {
        set((state) => {
          state.user = null;
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.error = null;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      refreshAuthToken: async () => {
        const { refreshToken, setAuth, clearAuth } = get();
        
        if (!refreshToken) {
          clearAuth();
          return false;
        }

        try {
          const response = await fetch(`${env.API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          setAuth(data.user, data.token, data.refreshToken);
          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          clearAuth();
          return false;
        }
      },
    })),
    {
      name: 'cenopie-auth',
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for better performance
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useAuthActions = () => useAuthStore((state) => ({
  setAuth: state.setAuth,
  updateUser: state.updateUser,
  clearAuth: state.clearAuth,
  setLoading: state.setLoading,
  setError: state.setError,
  refreshAuthToken: state.refreshAuthToken,
}));

export const useAuthToken = () => useAuthStore((state) => state.token);