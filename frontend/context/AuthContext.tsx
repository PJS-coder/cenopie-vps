"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, isNewUser?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Check if user is authenticated on initial load
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    }
  }, []);

  const login = async (token: string, isNewUser: boolean = false) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
      setIsAuthenticated(true);
      
      // Use router.push for navigation
      if (isNewUser) {
        router.push('/onboarding');
      } else {
        localStorage.setItem('onboardingCompleted', 'true');
        router.push('/feed');
      }
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('onboardingCompleted');
      setIsAuthenticated(false);
      router.push('/auth/login');
    }
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return <div>{children}</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return default values instead of throwing error
    return {
      isAuthenticated: false,
      login: () => {},
      logout: () => {}
    };
  }
  return context;
}