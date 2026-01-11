"use client";
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CameraIcon, UserIcon } from '@heroicons/react/24/outline';
import { profileApi } from '@/lib/api';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';

const onboardingSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  country: z.string().min(2, 'Please select your country'),
  city: z.string().min(2, 'Please enter your city'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema)
  });

  // Pre-fill email if available from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          if (user.email) {
            setValue('email', user.email);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  }, [setValue]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setProfileImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('country', data.country);
      formData.append('city', data.city);
      
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      // Update user profile
      await profileApi.updateProfile(formData);

      // Update localStorage with new user data
      const fullName = `${data.firstName} ${data.lastName}`;
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const updatedUser = {
        ...currentUser,
        name: fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        country: data.country,
        city: data.city,
        location: `${data.city}, ${data.country}`,
        profileCompleted: true,
        onboardingCompleted: true
      };
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Set a flag to indicate onboarding is completed
      localStorage.setItem('onboardingCompleted', 'true');

      // Redirect to feed
      router.replace('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const watchedFields = watch();
  const isFormValid = watchedFields.firstName && watchedFields.lastName && 
                     watchedFields.email && watchedFields.country && watchedFields.city;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to Cenopie! 🎉
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Let's set up your profile to get you connected with the right people
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Profile Image Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Profile preview"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                      <UserIcon className="w-12 h-12 text-gray-400" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white p-2 rounded-full shadow-lg transition-colors"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Optional - You can add this later</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  className="text-base"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className="text-base"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="text-base"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Location Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country/Region *</Label>
                <Input
                  id="country"
                  placeholder="India"
                  className="text-base"
                  {...register('country')}
                />
                {errors.country && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.country.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City or Location *</Label>
                <Input
                  id="city"
                  placeholder="Mumbai"
                  className="text-base"
                  {...register('city')}
                />
                {errors.city && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.city.message}</p>
                )}
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Profile Completion</span>
                <span className="text-[#0BC0DF] font-medium">
                  {Object.values(watchedFields).filter(Boolean).length}/5 fields
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-[#0BC0DF] h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(Object.values(watchedFields).filter(Boolean).length / 5) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Mark onboarding as completed even when skipped
                  localStorage.setItem('onboardingCompleted', 'true');
                  router.replace('/feed');
                }}
                className="flex-1"
                disabled={isLoading}
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </ProtectedRoute>
  );
}
