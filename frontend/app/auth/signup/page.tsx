"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import RedirectIfAuthenticated from '@/components/RedirectIfAuthenticated';
import { UserCircleIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useRegistrationStatus } from '@/hooks/useRegistrationStatus';
import { useRouter } from 'next/navigation';

const schema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Must be at least 8 characters')
    .refine((val) => /[a-z]/.test(val), { message: 'Must contain lowercase' })
    .refine((val) => /[A-Z]/.test(val), { message: 'Must contain uppercase' })
    .refine((val) => /[0-9]/.test(val), { message: 'Must contain number' })
    .refine((val) => /[!@#$%^&*]/.test(val), { message: 'Must contain special character' }),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const { allowRegistration, isClosedBeta, loading: statusLoading, message } = useRegistrationStatus();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({ 
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  });
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  // Redirect to login if registration is disabled
  useEffect(() => {
    if (!statusLoading && !allowRegistration) {
      router.push('/auth/login?message=registration_disabled');
    }
  }, [statusLoading, allowRegistration, router]);
  
  const password = watch('password', '');
  const passwordChecks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setTouched(true);
    
    try {
      const response = await authApi.signup(data.name, data.email, data.password);
      login(response.token, true);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('already exists')) {
          setError('An account with this email already exists. Please login instead.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Signup failed. Please try again.');
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
              {/* Left Side - Image */}
              <div className="hidden md:block md:col-span-2 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80" 
                  alt="Students collaborating" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0BC0DF]/90 to-cyan-500/90"></div>
                <div className="relative h-full flex flex-col justify-end p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">
                    {isClosedBeta ? 'Cenopie Closed Beta' : 'Join Cenopie Today'}
                  </h2>
                  <p className="text-cyan-100 text-sm">
                    {isClosedBeta ? 'Currently available to existing users only' : 'Start your career journey with us'}
                  </p>
                </div>
              </div>

              {/* Right Side - Form or Closed Beta Message */}
              <div className="md:col-span-3 bg-white p-8 flex flex-col justify-center">
                {statusLoading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0BC0DF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking registration status...</p>
                  </div>
                ) : isClosedBeta ? (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Closed Beta</h2>
                      <p className="text-gray-600 mb-6">
                        Cenopie is currently in closed beta mode. New registrations are temporarily disabled.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-blue-800 text-sm">
                          <strong>Existing users:</strong> You can still log in to access your account.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Link href="/auth/login">
                          <Button className="w-full bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white">
                            Login to Existing Account
                          </Button>
                        </Link>
                        <Link href="/landing">
                          <Button variant="outline" className="w-full">
                            Back to Home
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h2>
                      <p className="text-gray-600 text-sm">Sign up to get started</p>
                    </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Full Name"
                        required
                        className={`h-11 pl-11 border-gray-300 focus:border-[#0BC0DF] ${
                          touched && errors.name ? 'border-red-300' : ''
                        }`}
                        {...register('name')} 
                      />
                    </div>
                    {touched && errors.name && (
                      <p className="text-xs text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="Email Address"
                        required
                        className={`h-11 pl-11 border-gray-300 focus:border-[#0BC0DF] ${
                          touched && errors.email ? 'border-red-300' : ''
                        }`}
                        {...register('email')} 
                      />
                    </div>
                    {touched && errors.email && (
                      <p className="text-xs text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        required
                        className={`h-11 pl-11 pr-11 border-gray-300 focus:border-[#0BC0DF] ${
                          touched && errors.password ? 'border-red-300' : ''
                        }`}
                        {...register('password')} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {password && password.length > 0 && (
                      <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-green-600' : 'text-gray-500'}`}>
                            {passwordChecks.length ? <CheckCircleIcon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                            <span className="font-medium">8+ chars</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                            {passwordChecks.lowercase ? <CheckCircleIcon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                            <span className="font-medium">Lowercase</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                            {passwordChecks.uppercase ? <CheckCircleIcon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                            <span className="font-medium">Uppercase</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordChecks.number ? 'text-green-600' : 'text-gray-500'}`}>
                            {passwordChecks.number ? <CheckCircleIcon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                            <span className="font-medium">Number</span>
                          </div>
                          <div className={`flex items-center gap-1.5 col-span-2 ${passwordChecks.special ? 'text-green-600' : 'text-gray-500'}`}>
                            {passwordChecks.special ? <CheckCircleIcon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                            <span className="font-medium">Special (!@#$%^&*)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white font-semibold rounded-lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'CREATE ACCOUNT'}
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

                {/* Gmail Sign Up Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: Implement Gmail OAuth functionality
                      alert('Gmail sign-up functionality will be implemented soon!');
                    }}
                    className="w-full h-11 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Gmail
                  </button>
                </div>

                <div className="mt-5 text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-[#0BC0DF] hover:text-[#0aa9c4] font-semibold">
                      Login here
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
                  
                  {!isClosedBeta && (
                    <Link 
                      href="/company/auth/register" 
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Register as Company →
                    </Link>
                  )}
                </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
}
