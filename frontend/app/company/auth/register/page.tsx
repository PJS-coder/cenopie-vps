'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import RedirectIfCompanyAuthenticated from '@/components/RedirectIfCompanyAuthenticated';
import { useRegistrationStatus } from '@/hooks/useRegistrationStatus';

export default function CompanyRegisterPage() {
  const router = useRouter();
  const { allowRegistration, isClosedBeta, loading: statusLoading } = useRegistrationStatus();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Redirect to company login if registration is disabled
  useEffect(() => {
    if (!statusLoading && !allowRegistration) {
      router.push('/company/auth/login?message=registration_disabled');
    }
  }, [statusLoading, allowRegistration, router]);
  
  const [formData, setFormData] = useState({
    // Step 1: Account & Basic Info
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    description: '',
    
    // Step 2: Detailed Company Info
    industry: '',
    website: '',
    headquarters: '',
    size: '',
    founded: '',
    businessRegistration: '',
    taxId: '',
    contactPerson: '',
    contactPhone: ''
  });

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Consulting', 'Media', 'Real Estate', 'Transportation',
    'Energy', 'Agriculture', 'Construction', 'Entertainment', 'Other'
  ];

  const companySizes = [
    '1-10 employees',
    '11-50 employees', 
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword || 
          !formData.companyName || !formData.description) {
        setError('Please fill in all required fields');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    } else if (step === 2) {
      if (!formData.industry || !formData.headquarters || !formData.size || 
          !formData.businessRegistration || !formData.contactPerson || !formData.contactPhone) {
        setError('Please fill in all required fields');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(2);
      setError('');
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Company registration submitted successfully! You will receive an email once your company is verified and approved. You can now login to check your approval status.');
        router.push('/company/auth/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RedirectIfCompanyAuthenticated>
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <Card className="shadow-lg border border-gray-200">
            {statusLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0BC0DF] mx-auto mb-4"></div>
                <p className="text-gray-600">Checking registration status...</p>
              </div>
            ) : isClosedBeta ? (
              <>
                <CardHeader className="space-y-1 px-6 pt-8 pb-6">
                  <CardTitle className="text-2xl font-bold text-center text-gray-900">Company Registration</CardTitle>
                  <CardDescription className="text-center text-gray-600">
                    Currently Unavailable
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-6 pb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Closed Beta Mode</h3>
                    <p className="text-gray-600 mb-6">
                      Company registrations are currently disabled. Cenopie is in closed beta mode.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800 text-sm">
                        <strong>Existing companies:</strong> You can still log in to access your company dashboard.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Link href="/company/auth/login">
                        <Button className="w-full bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white">
                          Login to Company Account
                        </Button>
                      </Link>
                      <Link href="/landing">
                        <Button variant="outline" className="w-full">
                          Back to Home
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="space-y-1 px-6 pt-8 pb-6">
                  <CardTitle className="text-2xl font-bold text-center text-gray-900">Register Your Company</CardTitle>
                  <CardDescription className="text-center text-gray-600">
                    Step {currentStep} of 2: {currentStep === 1 ? 'Account & Basic Info' : 'Company Details'}
                  </CardDescription>
                </CardHeader>

                {/* Progress Indicator */}
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep >= 1 ? 'bg-[#0BC0DF] text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {currentStep > 1 ? <CheckCircleIcon className="w-5 h-5" /> : '1'}
                      </div>
                      <div className={`w-16 h-1 mx-2 ${currentStep > 1 ? 'bg-[#0BC0DF]' : 'bg-gray-200'}`} />
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep >= 2 ? 'bg-[#0BC0DF] text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        2
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>Account</span>
                    <span>Details</span>
                  </div>
                </div>
          
          <CardContent className="px-6">
            <form onSubmit={currentStep === 2 ? handleSubmit : (e) => e.preventDefault()} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Company Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="company@example.com"
                      className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Min 6 characters"
                          className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF] pr-10"
                          required
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

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm password"
                        className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">Company Name *</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Your company name"
                      className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">Company Description *</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe what your company does, its mission, and values..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#0BC0DF] focus:ring-[#0BC0DF] resize-none"
                      required
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-sm font-medium text-gray-700">Industry *</Label>
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="w-full h-12 px-3 border border-gray-200 rounded-lg focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                        required
                      >
                        <option value="">Select industry</option>
                        {industries.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size" className="text-sm font-medium text-gray-700">Company Size *</Label>
                      <select
                        id="size"
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        className="w-full h-12 px-3 border border-gray-200 rounded-lg focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                        required
                      >
                        <option value="">Select size</option>
                        {companySizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="headquarters" className="text-sm font-medium text-gray-700">Headquarters *</Label>
                      <Input
                        id="headquarters"
                        name="headquarters"
                        value={formData.headquarters}
                        onChange={handleInputChange}
                        placeholder="City, Country"
                        className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="founded" className="text-sm font-medium text-gray-700">Founded Year</Label>
                      <Input
                        id="founded"
                        type="number"
                        name="founded"
                        value={formData.founded}
                        onChange={handleInputChange}
                        placeholder="2020"
                        min="1800"
                        max={new Date().getFullYear()}
                        className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://yourcompany.com"
                      className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessRegistration" className="text-sm font-medium text-gray-700">Business Registration Number *</Label>
                    <Input
                      id="businessRegistration"
                      name="businessRegistration"
                      value={formData.businessRegistration}
                      onChange={handleInputChange}
                      placeholder="Your business registration number"
                      className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId" className="text-sm font-medium text-gray-700">Tax ID (Optional)</Label>
                    <Input
                      id="taxId"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleInputChange}
                      placeholder="Tax identification number"
                      className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson" className="text-sm font-medium text-gray-700">Contact Person *</Label>
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        placeholder="Full name of authorized person"
                        className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700">Contact Phone *</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        className="h-12 border-gray-200 focus:border-[#0BC0DF] focus:ring-[#0BC0DF]"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Verification Process:</strong> Your company registration will be reviewed by our team. 
                      You will receive an email notification once approved (usually within 1-2 business days).
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="px-6"
                    >
                      ← Back
                    </Button>
                  )}
                </div>
                
                <div>
                  {currentStep < 2 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-[#0BC0DF] hover:bg-[#0aa9c4] px-8"
                    >
                      Next →
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-[#0BC0DF] hover:bg-[#0aa9c4] px-8"
                    >
                      {loading ? 'Submitting...' : 'Register Company'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="px-6 pb-8">
            <div className="w-full text-center space-y-4">
              <p className="text-sm text-gray-600">
                Already have a company account?{' '}
                <Link href="/company/auth/login" className="text-[#0BC0DF] hover:text-[#0aa9c4] font-medium transition-colors">
                  Sign in here
                </Link>
              </p>
              
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                  Looking for user registration?{' '}
                  <Link href="/auth/signup" className="text-[#0BC0DF] hover:text-[#0aa9c4] font-medium transition-colors">
                    User Signup
                  </Link>
                </p>
              </div>
            </div>
          </CardFooter>
                </>
              )}
        </Card>
      </div>
    </div>
    </RedirectIfCompanyAuthenticated>
  );
}