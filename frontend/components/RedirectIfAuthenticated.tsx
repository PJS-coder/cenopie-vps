"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RedirectIfAuthenticated({ 
  children, 
  redirectTo = '/feed' 
}: RedirectIfAuthenticatedProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Check for user authentication
      const userToken = localStorage.getItem('authToken');
      
      // Check for company authentication
      const companyToken = localStorage.getItem('companyAuthToken');
      
      if (userToken || isAuthenticated) {
        // User is logged in, redirect to feed
        setShouldRedirect(true);
        router.push('/feed');
        return;
      }
      
      if (companyToken) {
        // Company is logged in, redirect to company dashboard
        setShouldRedirect(true);
        router.push('/company/dashboard');
        return;
      }
      
      // No authentication found, show the page
      setIsLoading(false);
    };

    checkAuth();
  }, [isAuthenticated, router]);

  // Handle redirects
  useEffect(() => {
    if (shouldRedirect) {
      // Don't render anything while redirecting
      return;
    }
  }, [shouldRedirect]);

  if (isLoading || shouldRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300/20 border-t-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}