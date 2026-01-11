"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      console.log('ProtectedRoute: Checking auth, token exists:', !!token);
      console.log('ProtectedRoute: Current pathname:', pathname);
      
      if (!token) {
        console.log('ProtectedRoute: No token, redirecting to login');
        setShouldRedirect('/auth/login');
      } else {
        console.log('ProtectedRoute: Token found, setting authenticated');
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (shouldRedirect) {
      console.log('Redirecting to:', shouldRedirect);
      router.push(shouldRedirect as any);
      setShouldRedirect(null);
    }
  }, [shouldRedirect, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-optimized-spin rounded-full h-8 w-8 border-2 border-gray-300/20 border-t-gray-900"></div>
      </div>
    );
  }

  if (shouldRedirect) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}