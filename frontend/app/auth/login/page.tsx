"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import RedirectIfAuthenticated from '@/components/RedirectIfAuthenticated';
import { UserIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ 
    resolver: zodResolver(schema) 
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegistrationMessage, setShowRegistrationMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get('message') === 'registration_disabled') {
      setShowRegistrationMessage(true);
    }
  }, [searchParams]);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(data.email, data.password);
      login(response.token, false);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid credentials') || err.message.includes('401')) {
          setError('Invalid email or password. Please try again.');
        } else if (err.message.includes('User not found')) {
          setError('No account found with this email. Please sign up first.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <Card className="shadow-xl border border-gray-200 overflow-hidden rounded-xl bg-white">
            <div className="grid md:grid-cols-5">
              {/* Left Side - Image (2 columns) */}
              <div className="hidden md:block md:col-span-2 relative overflow-hidden">
                {/* Professional placement/college image */}
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80" 
                  alt="Students collaborating" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0BC0DF]/90 to-cyan-500/90"></div>
                <div className="relative h-full flex flex-col justify-end p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">Welcome to Cenopie</h2>
                  <p className="text-cyan-100 text-sm">Your gateway to career opportunities</p>
                </div>
              </div>

              {/* Right Side - Login Form (3 columns) */}
              <div className="md:col-span-3 bg-white p-8 flex flex-col justify-center">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Login to Account</h2>
                  <p className="text-gray-600 text-sm">Enter your credentials to continue</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {showRegistrationMessage && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong>Closed Beta:</strong> New registrations are currently disabled. Existing users can still log in.</span>
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
                        id="email"
                        type="email"
                        placeholder="Email Address"
                        required
                        className={`h-12 pl-11 border-gray-300 focus:border-[#0BC0DF] focus:ring-[#0BC0DF] ${
                          errors.email ? 'border-red-300' : ''
                        }`}
                        {...register('email')} 
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        required
                        className={`h-12 pl-11 pr-11 border-gray-300 focus:border-[#0BC0DF] focus:ring-[#0BC0DF] ${
                          errors.password ? 'border-red-300' : ''
                        }`}
                        {...register('password')} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white font-semibold rounded-lg transition-colors" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'LOGIN'}
                  </Button>
                </form>

                {/* OR Divider */}
                <div className="mt-4 mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-gray-500 font-medium">Or</span>
                    </div>
                  </div>
                </div>

                {/* Gmail Sign In Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: Implement Gmail OAuth functionality
                      alert('Gmail sign-in functionality will be implemented soon!');
                    }}
                    className="w-full h-11 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Gmail
                  </button>
                </div>

                <div className="mt-5 text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="text-[#0BC0DF] hover:text-[#0aa9c4] font-semibold transition-colors">
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
                    href="/company/auth/login" 
                    className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Login as Company →
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
}
