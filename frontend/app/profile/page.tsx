'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  PencilIcon, 
  BriefcaseIcon, 
  AcademicCapIcon, 
  MapPinIcon, 
  CameraIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  TrophyIcon,
  EyeIcon,
  ChartBarIcon,
  CalendarIcon,
  LinkIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { profileApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import VerificationBadge from '@/components/VerificationBadge';

import SimpleLoader from '@/components/SimpleLoader';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  pronouns?: string;
  links?: { label: string; url: string }[];
  followers: string[];
  following: string[];
  education?: {
    _id?: string;
    college: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear: number;
    current: boolean;
  }[];
  experience?: {
    _id?: string;
    company: string;
    jobTitle: string;
    employmentType: string;
    startDate: string;
    endDate?: string;
    description?: string;
    current: boolean;
  }[];
  certifications?: {
    _id?: string;
    name: string;
    organization: string;
    issueDate: string;
    expirationDate?: string;
    credentialId?: string;
    credentialUrl?: string;
    doesNotExpire: boolean;
  }[];
  skills?: {
    _id?: string;
    name: string;
    proficiency: string;
  }[];
  profileImage?: string;
  bannerImage?: string;
  totalInterviews?: number;
  selectedInterviews?: number;
  rejectedInterviews?: number;
  averageScore?: number;
  isVerified?: boolean;
  createdAt: string;
}

interface EducationForm {
  college: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
  current: boolean;
}

interface ExperienceForm {
  company: string;
  jobTitle: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
}

interface CertificationForm {
  name: string;
  organization: string;
  issueDate: string;
  expirationDate: string;
  credentialId: string;
  credentialUrl: string;
  doesNotExpire: boolean;
  [key: string]: any;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCertification, setIsSavingCertification] = useState(false);
  const [isSavingEducation, setIsSavingEducation] = useState(false);
  const [isSavingExperience, setIsSavingExperience] = useState(false);
  
  // Form states
  const [basicInfoForm, setBasicInfoForm] = useState<Partial<UserProfile>>({});
  const [educationForm, setEducationForm] = useState<EducationForm>({
    college: '',
    degree: '',
    fieldOfStudy: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear(),
    current: false
  });
  const [experienceForm, setExperienceForm] = useState<ExperienceForm>({
    company: '',
    jobTitle: '',
    employmentType: '',
    startDate: '',
    endDate: '',
    description: '',
    current: false
  });
  const [certificationForm, setCertificationForm] = useState<CertificationForm>({
    name: '',
    organization: '',
    issueDate: '',
    expirationDate: '',
    credentialId: '',
    credentialUrl: '',
    doesNotExpire: false
  });

  const profileImageRef = useRef<HTMLInputElement>(null);
  const bannerImageRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await profileApi.getProfile();
      const userProfile: UserProfile = (response.data?.user || response.user) as UserProfile;
      setProfile(userProfile);
      
      setBasicInfoForm({
        name: userProfile.name,
        headline: userProfile.headline,
        bio: userProfile.bio,
        location: userProfile.location,
        pronouns: userProfile.pronouns
      });
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [router]);

  const handleEdit = () => {
    setIsEditing(!isEditing);
    setError(null);
    if (!isEditing && profile) {
      setBasicInfoForm({
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        pronouns: profile.pronouns
      });
    }
  };

  const handleSaveProfile = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      Object.keys(basicInfoForm).forEach(key => {
        const value = basicInfoForm[key as keyof typeof basicInfoForm];
        if (value !== undefined) {
          formData.append(key, value as string);
        }
      });
      
      if (profile?.education) {
        const educationForSerialization = profile.education.map(edu => {
          const eduCopy: Record<string, unknown> = { ...edu };
          if (eduCopy._id) {
            eduCopy._id = eduCopy._id.toString();
          }
          return eduCopy;
        });
        formData.append('education', JSON.stringify(educationForSerialization));
      }
      
      if (profile?.experience) {
        const experienceForSerialization = profile.experience.map(exp => {
          const expCopy: Record<string, unknown> = { ...exp };
          if (expCopy._id) {
            expCopy._id = expCopy._id.toString();
          }
          if (expCopy.startDate && typeof expCopy.startDate === 'object' && expCopy.startDate instanceof Date) {
            expCopy.startDate = expCopy.startDate.toISOString();
          }
          if (expCopy.endDate && typeof expCopy.endDate === 'object' && expCopy.endDate instanceof Date) {
            expCopy.endDate = expCopy.endDate.toISOString();
          }
          return expCopy;
        });
        formData.append('experience', JSON.stringify(experienceForSerialization));
      }
      
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }
      
      if (bannerImageFile) {
        formData.append('bannerImage', bannerImageFile);
      }
      
      const response = await profileApi.updateProfile(formData);
      const updatedProfile: UserProfile = (response.data as UserProfile) || response;
      
      setProfile(updatedProfile);
      setIsEditing(false);
      setProfileImagePreview(null);
      setBannerImagePreview(null);
      setProfileImageFile(null);
      setBannerImageFile(null);
      
      if (updatedProfile) {
        // Update currentUser in localStorage with the fresh data
        localStorage.setItem('currentUser', JSON.stringify(updatedProfile));
        
        // Dispatch event to update UI immediately
        window.dispatchEvent(new Event('profileUpdated'));
      }
      
      setBasicInfoForm({
        name: updatedProfile.name,
        headline: updatedProfile.headline,
        bio: updatedProfile.bio,
        location: updatedProfile.location,
        pronouns: updatedProfile.pronouns
      });
      
    } catch (err) {
      console.error('Profile save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'profile') {
          setProfileImagePreview(reader.result as string);
          setProfileImageFile(file);
        } else {
          setBannerImagePreview(reader.result as string);
          setBannerImageFile(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerProfileImageUpload = () => {
    profileImageRef.current?.click();
  };

  const triggerBannerImageUpload = () => {
    bannerImageRef.current?.click();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <SimpleLoader size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-500">Error loading profile</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold">Profile not found</h2>
            <p className="text-gray-600">Redirecting to profile setup...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="relative w-full flex justify-center px-4 py-8">
          <div className="w-full max-w-[1200px]">
            <div className="flex gap-8">
              
              {/* Main Content Area */}
              <div className="flex-1 space-y-6">
                
                {/* Profile Header Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  
                  {/* Banner Section - Completely Separate from Profile Image */}
                  <div className="relative h-56">
                    {isEditing ? (
                      <div className="relative w-full h-full">
                        {/* Banner Image Display */}
                        <div className="w-full h-full">
                          {bannerImagePreview ? (
                            <Image 
                              src={bannerImagePreview} 
                              alt="Banner preview" 
                              width={800}
                              height={224}
                              className="w-full h-full object-cover"
                            />
                          ) : profile.bannerImage ? (
                            <Image 
                              src={profile.bannerImage} 
                              alt="Banner" 
                              width={800}
                              height={224}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                          )}
                        </div>
                        
                        {/* Banner Edit Button - Positioned Away from Profile Image Area */}
                        <div className="absolute top-4 left-4">
                          <Button
                            onClick={triggerBannerImageUpload}
                            size="sm"
                            className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm"
                          >
                            <CameraIcon className="w-4 h-4 mr-2" />
                            Change Banner
                          </Button>
                        </div>
                        
                        <input
                          type="file"
                          ref={bannerImageRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'banner')}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full">
                        {profile.bannerImage ? (
                          <div className="relative">
                            <Image 
                              src={profile.bannerImage} 
                              alt="Banner" 
                              width={800}
                              height={224}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M20%2020c0-5.5-4.5-10-10-10s-10%204.5-10%2010%204.5%2010%2010%2010%2010-4.5%2010-10zm10%200c0-5.5-4.5-10-10-10s-10%204.5-10%2010%204.5%2010%2010%2010%2010-4.5%2010-10z%22/%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Profile Image - Positioned Independently */}
                    <div className="absolute -bottom-20 left-8 z-30">
                      {isEditing ? (
                        <div className="relative">
                          <div 
                            className="relative w-40 h-40 bg-white rounded-full flex items-center justify-center cursor-pointer border-4 border-white shadow-2xl hover:shadow-3xl transition-all duration-300 group"
                            onClick={triggerProfileImageUpload}
                          >
                            {profileImagePreview ? (
                              <Image 
                                src={profileImagePreview} 
                                alt="Profile preview" 
                                width={160}
                                height={160}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : profile.profileImage ? (
                              <Image 
                                src={profile.profileImage} 
                                alt="Profile" 
                                width={160}
                                height={160}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <UserIcon className="w-20 h-20 text-gray-400" />
                            )}
                            <div className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-2 shadow-lg hover:bg-blue-700 transition-colors">
                              <CameraIcon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <input
                            type="file"
                            ref={profileImageRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'profile')}
                          />
                        </div>
                      ) : (
                        <div className="relative w-40 h-40 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
                          {profile.profileImage ? (
                            <Image 
                              src={profile.profileImage} 
                              alt={profile.name} 
                              width={160}
                              height={160}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <UserIcon className="w-20 h-20 text-gray-400" />
                          )}
                          <div className="absolute inset-0 rounded-full ring-4 ring-blue-500/20 ring-offset-4 ring-offset-white"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Profile Info Section */}
                  <div className="px-8 pt-24 pb-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="space-y-4">
                            {error && (
                              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                <p className="text-sm font-medium">{error}</p>
                              </div>
                            )}
                            <Input
                              value={basicInfoForm.name || ''}
                              onChange={(e) => setBasicInfoForm({...basicInfoForm, name: e.target.value})}
                              className="text-3xl font-bold bg-white border-gray-200 text-gray-900"
                            />
                            <Input
                              value={basicInfoForm.headline || ''}
                              onChange={(e) => setBasicInfoForm({...basicInfoForm, headline: e.target.value})}
                              placeholder="Your professional headline"
                              className="text-lg bg-white border-gray-200"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mb-2">
                              <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                                {profile.name}
                              </h1>
                              <VerificationBadge isVerified={profile.isVerified} size="md" />
                            </div>
                            {profile.headline && (
                              <p className="text-xl text-gray-700 font-medium leading-relaxed">
                                {profile.headline}
                              </p>
                            )}
                          </>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-4 text-gray-600">
                          {isEditing ? (
                            <Input
                              value={basicInfoForm.location || ''}
                              onChange={(e) => setBasicInfoForm({...basicInfoForm, location: e.target.value})}
                              placeholder="Your location"
                              className="w-auto bg-white border-gray-200"
                            />
                          ) : (
                            profile.location && (
                              <span className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                <MapPinIcon className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">{profile.location}</span>
                              </span>
                            )
                          )}
                          {profile.createdAt && (
                            <span className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                              <CalendarIcon className="w-4 h-4 text-green-600" />
                              <span className="font-medium">Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {isEditing ? (
                          <>
                            <Button
                              onClick={handleSaveProfile}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSaving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                  Saving...
                                </>
                              ) : (
                                'Save Changes'
                              )}
                            </Button>
                            <Button
                              onClick={() => setIsEditing(false)}
                              variant="outline"
                              disabled={isSaving}
                              className="border-gray-300 hover:bg-gray-50 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={handleEdit}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5"
                          >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Bio Section */}
                    {isEditing ? (
                      <Textarea
                        value={basicInfoForm.bio || ''}
                        onChange={(e) => setBasicInfoForm({...basicInfoForm, bio: e.target.value})}
                        placeholder="Tell us about yourself and your professional journey..."
                        className="min-h-[100px] mt-6 bg-white border-gray-200 text-gray-700"
                      />
                    ) : (
                      profile.bio && (
                        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-gray-200">
                          <p className="text-gray-700 leading-relaxed text-lg">
                            {profile.bio}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                        <CheckBadgeIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{profile.totalInterviews || 0}</p>
                        <p className="text-sm text-gray-600 font-medium">TOTAL INTERVIEWS</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{profile.selectedInterviews || 0}</p>
                        <p className="text-sm text-gray-600 font-medium">SELECTED</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{profile.rejectedInterviews || 0}</p>
                        <p className="text-sm text-gray-600 font-medium">REJECTED</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{profile.averageScore || 0}</p>
                        <p className="text-sm text-gray-600 font-medium">SCORE</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                {(profile.bio || isEditing) && (
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-xl">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      About
                    </h2>
                    {isEditing ? (
                      <Textarea
                        value={basicInfoForm.bio || ''}
                        onChange={(e) => setBasicInfoForm({...basicInfoForm, bio: e.target.value})}
                        placeholder="Tell us about yourself and your professional journey..."
                        className="min-h-[120px] bg-white border-gray-200 text-gray-700"
                      />
                    ) : (
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
                        <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                          {profile.bio}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Experience Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BriefcaseIcon className="w-5 h-5 text-[#0BC0DF]" />
                        Experience
                      </h2>
                      <Button
                        size="sm"
                        onClick={() => {
                          setExperienceForm({
                            company: '',
                            jobTitle: '',
                            employmentType: '',
                            startDate: '',
                            endDate: '',
                            description: '',
                            current: false
                          });
                          setEditingSection('experience');
                        }}
                        className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white text-xs px-3 py-1"
                      >
                        <PlusIcon className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    {profile.experience && profile.experience.length > 0 ? (
                      <div className="space-y-3">
                        {profile.experience.map((exp) => (
                          <div key={exp._id} className="p-3 border border-gray-100 rounded-lg hover:border-[#0BC0DF]/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-900 text-sm">
                                {exp.jobTitle}
                              </h3>
                              {exp.current && (
                                <span className="bg-[#0BC0DF] text-white px-2 py-1 rounded text-xs">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-1">
                              {exp.company}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''} - {
                                exp.endDate ? new Date(exp.endDate).toLocaleDateString() : (exp.current ? 'Present' : '')
                              }
                            </p>
                            {exp.description && (
                              <p className="text-gray-600 text-xs mt-2 leading-relaxed">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No work experience added yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Education Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <AcademicCapIcon className="w-5 h-5 text-[#0BC0DF]" />
                        Education
                      </h3>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEducationForm({
                            college: '',
                            degree: '',
                            fieldOfStudy: '',
                            startYear: new Date().getFullYear(),
                            endYear: new Date().getFullYear(),
                            current: false
                          });
                          setEditingSection('education');
                        }}
                        className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white text-xs px-3 py-1"
                      >
                        <PlusIcon className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    {profile.education && profile.education.length > 0 ? (
                      <div className="space-y-3">
                        {profile.education.map((edu) => (
                          <div key={edu._id} className="p-3 border border-gray-100 rounded-lg hover:border-[#0BC0DF]/30 transition-colors">
                            <h3 className="font-medium text-gray-900 text-sm mb-1">
                              {edu.degree}
                            </h3>
                            <p className="text-gray-600 text-sm mb-1">
                              {edu.college}
                            </p>
                            <p className="text-gray-500 text-xs mb-1">
                              {edu.fieldOfStudy}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {edu.startYear} - {edu.current ? 'Present' : edu.endYear}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No education information added yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Licenses & Certifications Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#0BC0DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Licenses & Certifications
                      </h3>
                      <Button
                        size="sm"
                        onClick={() => {
                          setCertificationForm({
                            name: '',
                            organization: '',
                            issueDate: '',
                            expirationDate: '',
                            credentialId: '',
                            credentialUrl: '',
                            doesNotExpire: false
                          });
                          setEditingSection('certifications');
                        }}
                        className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white text-xs px-3 py-1"
                      >
                        <PlusIcon className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    {/* Certification Form */}
                    {(editingSection === 'certifications' || editingSection?.startsWith('certification-edit-')) && (
                      <div className="mb-4 p-4 border border-[#0BC0DF]/20 rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-3">
                          {editingSection?.startsWith('certification-edit-') ? 'Edit License/Certification' : 'Add License/Certification'}
                        </h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Name (e.g., AWS Certified Solutions Architect)"
                            value={certificationForm.name}
                            onChange={(e) => setCertificationForm({...certificationForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0BC0DF] focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Issuing Organization (e.g., Amazon Web Services)"
                            value={certificationForm.organization}
                            onChange={(e) => setCertificationForm({...certificationForm, organization: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0BC0DF] focus:outline-none"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="date"
                              placeholder="Issue Date"
                              value={certificationForm.issueDate}
                              onChange={(e) => setCertificationForm({...certificationForm, issueDate: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0BC0DF] focus:outline-none"
                            />
                            <input
                              type="date"
                              placeholder="Expiration Date"
                              value={certificationForm.expirationDate}
                              onChange={(e) => setCertificationForm({...certificationForm, expirationDate: e.target.value})}
                              disabled={certificationForm.doesNotExpire}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0BC0DF] focus:outline-none disabled:bg-gray-100"
                            />
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="doesNotExpire"
                              checked={certificationForm.doesNotExpire}
                              onChange={(e) => setCertificationForm({...certificationForm, doesNotExpire: e.target.checked, expirationDate: e.target.checked ? '' : certificationForm.expirationDate})}
                              className="mr-2 accent-[#0BC0DF]"
                            />
                            <label htmlFor="doesNotExpire" className="text-xs">This credential does not expire</label>
                          </div>
                          <input
                            type="text"
                            placeholder="Credential ID (Optional)"
                            value={certificationForm.credentialId}
                            onChange={(e) => setCertificationForm({...certificationForm, credentialId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0BC0DF] focus:outline-none"
                          />
                          <input
                            type="url"
                            placeholder="Credential URL (Optional)"
                            value={certificationForm.credentialUrl}
                            onChange={(e) => setCertificationForm({...certificationForm, credentialUrl: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0BC0DF] focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingSection(null)}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                setIsSavingCertification(true);
                                let response;
                                
                                if (editingSection?.startsWith('certification-edit-')) {
                                  const certificationId = editingSection.split('certification-edit-')[1];
                                  response = await profileApi.updateCertification(certificationId, certificationForm);
                                } else {
                                  response = await profileApi.addCertification(certificationForm);
                                }
                                
                                // Update the profile state with the new certification data
                                if (response && response.data && response.data.user) {
                                  setProfile(prev => prev ? {
                                    ...prev,
                                    certifications: response.data!.user.certifications as any[]
                                  } : null);
                                }
                                
                                // Reset form and close
                                setCertificationForm({
                                  name: '',
                                  organization: '',
                                  issueDate: '',
                                  expirationDate: '',
                                  credentialId: '',
                                  credentialUrl: '',
                                  doesNotExpire: false
                                });
                                setEditingSection(null);
                              } catch (error) {
                                console.error('Error saving certification:', error);
                                setError(error instanceof Error ? error.message : 'Failed to save certification');
                              } finally {
                                setIsSavingCertification(false);
                              }
                            }}
                            disabled={!certificationForm.name || !certificationForm.organization || !certificationForm.issueDate || isSavingCertification}
                            className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingCertification ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                Saving...
                              </>
                            ) : (
                              editingSection?.startsWith('certification-edit-') ? 'Update Certification' : 'Add Certification'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {profile.certifications && profile.certifications.length > 0 ? (
                      <div className="space-y-3">
                        {profile.certifications.map((cert) => (
                          <div key={cert._id} className="p-3 border border-gray-100 rounded-lg hover:border-[#0BC0DF]/30 transition-colors relative">
                            <div className="flex justify-between items-start mb-2">
                              {cert.credentialUrl ? (
                                <a 
                                  href={cert.credentialUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-bold text-gray-900 text-sm hover:text-[#0BC0DF] transition-colors cursor-pointer"
                                >
                                  {cert.name}
                                </a>
                              ) : (
                                <h3 className="font-bold text-gray-900 text-sm">
                                  {cert.name}
                                </h3>
                              )}
                              <div className="flex items-center gap-2">
                                {cert.credentialUrl && (
                                  <a 
                                    href={cert.credentialUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white px-2 py-1 rounded text-xs transition-colors"
                                  >
                                    View Credential
                                  </a>
                                )}
                                <button
                                  onClick={() => {
                                    setCertificationForm({
                                      name: cert.name,
                                      organization: cert.organization,
                                      issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : '',
                                      expirationDate: cert.expirationDate ? new Date(cert.expirationDate).toISOString().split('T')[0] : '',
                                      credentialId: cert.credentialId || '',
                                      credentialUrl: cert.credentialUrl || '',
                                      doesNotExpire: cert.doesNotExpire || false
                                    });
                                    setEditingSection(`certification-edit-${cert._id}`);
                                  }}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-1">
                              {cert.organization}
                            </p>
                            <p className="text-gray-500 text-xs mb-1">
                              Issued: {new Date(cert.issueDate).toLocaleDateString()}
                            </p>
                            {!cert.doesNotExpire && cert.expirationDate && (
                              <p className="text-gray-500 text-xs mb-1">
                                Expires: {new Date(cert.expirationDate).toLocaleDateString()}
                              </p>
                            )}
                            {cert.doesNotExpire && (
                              <p className="text-green-600 text-xs mb-1">
                                No Expiration Date
                              </p>
                            )}
                            {cert.credentialId && (
                              <p className="text-gray-500 text-xs">
                                Credential ID: {cert.credentialId}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No licenses or certifications added yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Network Section */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-xl">
                        <UserGroupIcon className="w-6 h-6 text-white" />
                      </div>
                      Professional Network
                    </h3>
                  </div>
                  <div className="p-8">
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-2xl border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-xl">
                          <LinkIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-700 text-lg font-medium leading-relaxed">
                            Manage your professional connections and expand your network in the{' '}
                            <a 
                              href="/notifications?tab=network" 
                              className="text-teal-600 hover:text-teal-700 font-bold underline decoration-2 underline-offset-2 hover:decoration-teal-700 transition-colors"
                            >
                              Updates & Network
                            </a>{' '}
                            section.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}