'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RedirectIfCompanyAuthenticated from '@/components/RedirectIfCompanyAuthenticated';

export default function CompanyLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRegistrationMessage, setShowRegistrationMessage] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (searchParams.get('message') === 'registration_disabled') {
      setShowRegistrationMessage(true);
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('companyAuthToken', data.token);
        localStorage.setItem('currentCompany', JSON.stringify(data.company));
        window.dispatchEvent(new CustomEvent('companyAuthChange'));
        window.dispatchEvent(new CustomEvent('companyLogin'));
        router.push('/company/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RedirectIfCompanyAuthenticated>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <Card className="shadow-xl border border-gray-200 overflow-hidden rounded-xl bg-white">
            <div className="grid md:grid-cols-5">
              {/* Left Side - Image */}
              <div className="hidden md:block md:col-span-2 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80" 
                  alt="Business office" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0BC0DF]/90 to-cyan-500/90"></div>
                <div className="relative h-full flex flex-col justify-end p-8 text-white">
                  <BuildingOfficeIcon className="w-12 h-12 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Company Portal</h2>
                  <p className="text-cyan-100 text-sm">Manage your hiring and recruitment</p>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="md:col-span-3 bg-white p-8 flex flex-col justify-center">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Company Login</h2>
                  <p className="text-gray-600 text-sm">Access your company dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {showRegistrationMessage && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong>Closed Beta:</strong> Company registrations are currently disabled. Existing companies can still log in.</span>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        name="email"
                        type="email"
                        placeholder="Company Email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="h-11 pl-11 border-gray-300 focus:border-[#0BC0DF]"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="h-11 pl-11 pr-11 border-gray-300 focus:border-[#0BC0DF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white font-semibold rounded-lg" 
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'LOGIN'}
                  </Button>
                </form>

                <div className="mt-5 text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/company/auth/register" className="text-[#0BC0DF] hover:text-[#0aa9c4] font-semibold">
                      Register here
                    </Link>
                  </p>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-gray-500 font-medium">Or</span>
                    </div>
                  </div>
                  
                  <Link 
                    href="/auth/login" 
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Login as User →
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </RedirectIfCompanyAuthenticated>
  );
}
