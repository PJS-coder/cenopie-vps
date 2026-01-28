"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") return;
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        // No token, redirect to login immediately
        router.replace('/auth/login');
        return;
      }
      
      // Token exists, user is authenticated
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    // Check immediately without delay
    checkAuth();
  }, [router, pathname]);

  // Show minimal loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-[#0BC0DF]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}