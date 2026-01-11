'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function HRAdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and has HR or admin role
    const checkHRAccess = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        // Not logged in, show message
        return;
      }

      try {
        // Verify HR access with backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hr-admin/interviews/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          // User has HR access, redirect to interviews
          router.push('/hr-admin/interviews');
        }
      } catch (error) {
        console.error('Error checking HR access:', error);
      }
    };

    checkHRAccess();
  }, [router]);

  const handleGoToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
            <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            HR Admin Panel
          </h1>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>HR Access Required:</strong> You must be logged in as an HR user or admin to access this panel.
            </p>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please login with your HR credentials to continue.
          </p>

          <button
            onClick={handleGoToLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Go to Login
          </button>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have HR access? Contact your administrator to get HR role assigned.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
