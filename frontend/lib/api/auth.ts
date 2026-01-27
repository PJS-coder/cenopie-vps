import { api, ApiResponse } from './client';
import { useAuthStore, User } from '@/lib/stores/authStore';
import { env } from '@/lib/config/env';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authApi = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    
    if (response.success && response.data) {
      const { setAuth } = useAuthStore.getState();
      setAuth(response.data.user, response.data.token, response.data.refreshToken);
      
      // Dispatch storage event for cross-tab synchronization
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'cenopie-auth',
          newValue: JSON.stringify(useAuthStore.getState()),
        }));
      }
    }
    
    return response;
  },

  // Register user
  register: async (credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<AuthResponse>('/api/auth/register', credentials);
    
    if (response.success && response.data) {
      const { setAuth } = useAuthStore.getState();
      setAuth(response.data.user, response.data.token, response.data.refreshToken);
      
      // Dispatch storage event for cross-tab synchronization
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'cenopie-auth',
          newValue: JSON.stringify(useAuthStore.getState()),
        }));
      }
    }
    
    return response;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      const { clearAuth } = useAuthStore.getState();
      clearAuth();
      
      // Dispatch storage event for cross-tab synchronization
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'cenopie-auth',
          newValue: null,
        }));
      }
    }
  },

  // Refresh token
  refreshToken: async (): Promise<boolean> => {
    return useAuthStore.getState().refreshAuthToken();
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    return api.get<{ user: User }>('/api/auth/profile');
  },

  // Update user profile
  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.patch<{ user: User }>('/api/auth/profile', updates);
    
    if (response.success && response.data) {
      const { updateUser } = useAuthStore.getState();
      updateUser(response.data.user);
    }
    
    return response;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    return api.post<void>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
    return api.post<void>('/api/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
    return api.post<void>('/api/auth/reset-password', {
      token,
      newPassword,
    });
  },

  // Verify email
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    return api.post<void>('/api/auth/verify-email', { token });
  },

  // Resend verification email
  resendVerification: async (): Promise<ApiResponse<void>> => {
    return api.post<void>('/api/auth/resend-verification');
  },
};