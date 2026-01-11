"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RedirectIfCompanyAuthenticatedProps {
  children: React.ReactNode;
}

export default function RedirectIfCompanyAuthenticated({ 
  children 
}: RedirectIfCompanyAuthenticatedProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Check for company authentication
      const companyToken = localStorage.getItem('companyAuthToken');
      
      // Check for user authentication
      const userToken = localStorage.getItem('authToken');
      
      if (companyToken) {
        // Company is logged in, redirect to company dashboard
        setShouldRedirect(true);
        router.push('/company/dashboard');
        return;
      }
      
      if (userToken) {
        // User is logged in, redirect to feed
        setShouldRedirect(true);
        router.push('/feed');
        return;
      }
      
      // No authentication found, show the page
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading || shouldRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300/20 border-t-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}