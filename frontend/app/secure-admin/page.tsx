'use client';

import { KeyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isPasskeyAuthenticated } from '@/lib/passkeyAuth';

export default function SecureAdminHome() {
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated, if so redirect to dashboard
    if (isPasskeyAuthenticated()) {
      router.push('/secure-admin/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="w-full px-4 lg:px-6 flex justify-center">
          <div className="w-full lg:w-[800px] flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <KeyIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Secure Admin Panel</h1>
                <p className="text-sm text-gray-400">Restricted access area</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-300 hover:text-white text-sm"
              >
                Back to Site
              </button>
              <button
                onClick={() => router.push('/secure-admin/login')}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm text-white"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 lg:px-6 py-8 flex justify-center">
        {/* Center content area with responsive width */}
        <div className="w-full lg:w-[800px] space-y-6">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <KeyIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-6">Admin Panel</h2>
              
              <div className="max-w-sm mx-auto space-y-3">
                <button
                  onClick={() => router.push('/secure-admin/login')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg inline-flex items-center justify-center"
                >
                  Login
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </button>
                
                <button
                  onClick={() => router.push('/secure-admin/dashboard')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg inline-flex items-center justify-center"
                >
                  Dashboard
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}