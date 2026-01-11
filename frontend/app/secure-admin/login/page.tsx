'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authenticateWithPasskey, isPasskeyAuthenticated } from '@/lib/passkeyAuth';

export default function SecureAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Redirect if already authenticated
    if (isPasskeyAuthenticated()) {
      router.push('/secure-admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Verify passkey
      const passkeyValid = authenticateWithPasskey(passkey);
      if (!passkeyValid) {
        setError('Invalid passkey');
        setLoading(false);
        return;
      }

      // Step 2: Login as admin user
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!loginResponse.ok) {
        setError('Invalid admin credentials');
        setLoading(false);
        return;
      }

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Step 3: Verify user is admin
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify-admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!verifyResponse.ok) {
        setError('Access denied. You must be an admin user.');
        setLoading(false);
        return;
      }

      // Store token and redirect
      localStorage.setItem('authToken', token);
      router.push('/secure-admin/dashboard');
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-gray-800 p-3 rounded-full">
            <KeyIcon className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Secure Admin Access
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Enter passkey to access the secure administration panel
        </p>
        
        {/* Admin Only Warning */}
        <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-4 mx-4">
          <p className="text-sm text-red-300 text-center">
            <strong>⚠️ Admin Only:</strong> You must be logged in as an admin user to access this panel.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Admin Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Admin Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="passkey" className="block text-sm font-medium text-gray-300">
                Secure Passkey
              </label>
              <div className="mt-1 relative">
                <input
                  id="passkey"
                  name="passkey"
                  type={showPasskey ? 'text' : 'password'}
                  required
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter secure passkey"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPasskey(!showPasskey)}
                >
                  {showPasskey ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900 border border-red-700 rounded-md p-3">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Authenticating...' : 'Access Secure Panel'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="bg-yellow-900 border border-yellow-700 rounded-md p-3">
              <p className="text-xs text-yellow-200">
                <strong>Security Notice:</strong> This is a highly restricted area. 
                You must have both admin credentials and the secure passkey to access this panel.
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              ← Back to main site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}