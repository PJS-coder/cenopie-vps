'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  UserIcon, 
  PencilIcon, 
  BriefcaseIcon, 
  AcademicCapIcon, 
  MapPinIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  TrophyIcon, 
  EyeIcon, 
  CameraIcon,
  PlusIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  UserPlusIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  AtSymbolIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  LinkIcon,
  PhoneIcon,
  TrashIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { profileApi, companyApi } from '@/lib/api'; 
import ProtectedRoute from '@/components/ProtectedRoute';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import ConnectButton from '@/components/ConnectButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import VerificationBadge from '@/components/VerificationBadge';
import PostCard from '@/components/PostCard';
import { useUserPosts } from '@/hooks/useUserPosts';

// --- Interface Definitions ---

interface Company {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  logo?: string;
  location?: string;
  size?: string;
  founded?: number;
  isVerified?: boolean;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  pronouns?: string | null;
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
    endDate?: string | null;
    description?: string | null;
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
  }[];
  companies?: Company[];
  profileImage?: string | null;
  bannerImage?: string | null;
  totalInterviews?: number;
  selectedInterviews?: number;
  rejectedInterviews?: number;
  averageScore?: number;
  isVerified?: boolean;
  createdAt: string;
  connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self';
  connectionId?: string | null;
}

interface EducationForm {
  college: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
  current: boolean;
  [key: string]: any;
}

interface ExperienceForm {
  company: string;
  jobTitle: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
  [key: string]: any;
}

interface SkillForm {
  name: string;
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

// Helper to format ISO string to YYYY-MM-DD for <input type="date">
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

// --- User Posts Section Component ---

const UserPostsSection = ({ userId, isOwnProfile, currentUserId }: { userId: string; isOwnProfile: boolean; currentUserId: string | null }) => {
  const { posts, loading, error } = useUserPosts(userId);
  const router = useRouter();

  if (loading) {
    return <LoadingSkeleton variant="rectangular" />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error loading posts</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-gray-500 italic">
        {isOwnProfile ? 'You haven\'t posted anything yet.' : 'This user hasn\'t posted anything yet.'}
      </p>
    );
  }

  // Show only the first 4 posts in a 2x2 grid
  const displayedPosts = posts.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedPosts.map((post: any) => (
          <div 
            key={post.id} 
            className="w-full h-64 overflow-hidden cursor-pointer transition-transform hover:scale-105 group"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/posts/${post.id}`);
            }}
          >
            <div className="h-full w-full border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow relative">
              {/* Overlay to capture clicks */}
              <div className="absolute inset-0 z-10 bg-transparent" />
              <div className="pointer-events-none">
                <PostCard
                  id={post.id}
                  author={post.author}
                  role={post.role}
                  content={post.content}
                  likes={post.likes}
                  comments={post.comments}
                  shares={post.shares}
                  timestamp={post.timestamp}
                  image={post.image}
                  mediaType={post.mediaType}
                  isUserConnected={post.isConnected}
                  currentUserId={currentUserId || undefined}
                  postAuthorId={post.authorId}
                  profileImage={post.profileImage}
                  isRepost={post.isRepost}
                  originalPost={post.originalPost}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {posts.length > 4 && (
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            className="border-[#0BC0DF] text-[#0BC0DF] hover:bg-[#0BC0DF] hover:text-white px-8 py-2"
            onClick={() => router.push(`/profile/${userId}/posts`)}
          >
            Show More Posts
          </Button>
        </div>
      )}
    </div>
  );
};

// --- Profile Page Component ---

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeForm, setActiveForm] = useState<string | null>(null); 
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEducation, setIsSavingEducation] = useState(false);
  const [isSavingExperience, setIsSavingExperience] = useState(false);
  
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
  const [skillForm, setSkillForm] = useState<SkillForm>({
    name: ''
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
  const params = useParams();
  const userId = params.id as string;

  const getCurrentUserId = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return currentUser._id || currentUser.id;
    } catch (error) {
      return null;
    }
  };
  
  const currentUserId = getCurrentUserId();
  const isOwnProfile = currentUserId && currentUserId === userId;
  
  
  // --- Profile Fetching ---
  
  const fetchUserCompanies = useCallback(async (userId: string) => {
    // Set empty array by default since we don't have companies functionality yet
    setCompanies([]);
  }, []);

  const refetchProfile = useCallback(async (idToFetch: string | null) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = idToFetch 
        ? await profileApi.getProfileById(idToFetch)
        : await profileApi.getProfile();
        
      const userProfile = response.data?.user || response.user;
      
      if (userProfile) {
        const id = (userProfile as { id?: string; _id?: string }).id || (userProfile as { id?: string; _id?: string })._id || '';
        
        const mappedProfile: UserProfile = {
          ...userProfile as UserProfile, 
          id,
        };
        setProfile(mappedProfile);
        
        // Fetch companies for this user
        if (id) {
          await fetchUserCompanies(id);
        }
        
        setBasicInfoForm({
          name: mappedProfile.name || '',
          headline: mappedProfile.headline || '',
          bio: mappedProfile.bio || '',
          location: mappedProfile.location || '',
          pronouns: mappedProfile.pronouns || ''
        });
        
      } else {
        setError('User profile not found');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    const idToFetch = userId || null; 
    refetchProfile(idToFetch);
  }, [userId, refetchProfile]);

  // --- Form Handlers and CRUD Logic ---
  
  const resetEducationForm = () => setEducationForm({
    college: '',
    degree: '',
    fieldOfStudy: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear(),
    current: false
  });
  
  const resetExperienceForm = () => setExperienceForm({
    company: '',
    jobTitle: '',
    employmentType: '',
    startDate: '',
    endDate: '',
    description: '',
    current: false
  });

  const handleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing && profile) {
      setBasicInfoForm({
        name: profile.name || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        location: profile.location || '',
        pronouns: profile.pronouns || ''
      });
    } else {
        setProfileImagePreview(null);
        setBannerImagePreview(null);
        setProfileImageFile(null);
        setBannerImageFile(null);
        setActiveForm(null); 
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const formData = new FormData();
      
      // Add basic info fields
      Object.keys(basicInfoForm).forEach(key => {
        const value = basicInfoForm[key as keyof typeof basicInfoForm];
        if (value !== undefined && value !== null) { 
          formData.append(key, value as string);
        }
      });
      
      // Add stats fields if they exist
      if (profile?.totalInterviews !== undefined) {
        formData.append('totalInterviews', profile.totalInterviews.toString());
      }
      if (profile?.selectedInterviews !== undefined) {
        formData.append('selectedInterviews', profile.selectedInterviews.toString());
      }
      if (profile?.rejectedInterviews !== undefined) {
        formData.append('rejectedInterviews', profile.rejectedInterviews.toString());
      }
      if (profile?.averageScore !== undefined) {
        formData.append('averageScore', profile.averageScore.toString());
      }
      
      // Add profile and banner images if they exist
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }
      
      if (bannerImageFile) {
        formData.append('bannerImage', bannerImageFile);
      }
      
      // If we have image files, use FormData; otherwise use JSON
      let response;
      if (profileImageFile || bannerImageFile) {
        // Use FormData for file uploads
        response = await profileApi.updateProfile(formData);
      } else {
        // Use JSON for text-only updates
        const profileUpdate = {
          name: basicInfoForm.name || undefined,
          headline: basicInfoForm.headline || undefined,
          bio: basicInfoForm.bio || undefined,
          location: basicInfoForm.location || undefined,
          pronouns: basicInfoForm.pronouns || undefined
        };
        response = await profileApi.updateProfile(profileUpdate);
      }
      
      // Handle the response based on its structure
      const updatedProfile = (response as any)?.data?.user || (response as any)?.user || response;
      if (updatedProfile) {
        const id = (updatedProfile as { id?: string; _id?: string }).id || (updatedProfile as { id?: string; _id?: string })._id || '';
        const profileWithId = {
          ...updatedProfile as UserProfile,
          id
        };
        setProfile(profileWithId);
        
        // Update localStorage if this is the current user's profile
        const currentUserId = getCurrentUserId();
        if (currentUserId && (id === currentUserId || (updatedProfile as any)._id === currentUserId)) {
          localStorage.setItem('currentUser', JSON.stringify(profileWithId));
          
          // Dispatch event to update UI immediately
          window.dispatchEvent(new Event('profileUpdated'));
        }
      }
      setIsEditing(false);
      setProfileImagePreview(null);
      setBannerImagePreview(null);
      setProfileImageFile(null);
      setBannerImageFile(null);
      setActiveForm(null); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const addEducation = async () => {
    try {
      setIsSavingEducation(true);
      const educationData = {
        ...educationForm,
        startYear: Number(educationForm.startYear), 
        endYear: Number(educationForm.endYear),
      };
      
      await profileApi.addEducation(educationData);
      await refetchProfile(currentUserId); 
      resetEducationForm();
      setActiveForm(null);
    } catch (err) {
      console.error('Add education error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add education');
    } finally {
      setIsSavingEducation(false);
    }
  };

  const addExperience = async () => {
    try {
      setIsSavingExperience(true);
      await profileApi.addExperience(experienceForm);
      await refetchProfile(currentUserId); 
      resetExperienceForm();
      setActiveForm(null);
    } catch (err) {
      console.error('Add experience error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add experience');
    } finally {
      setIsSavingExperience(false);
    }
  };

  const updateEducation = async (id: string) => {
    try {
      setIsSavingEducation(true);
      const educationData = {
        ...educationForm,
        startYear: Number(educationForm.startYear), 
        endYear: Number(educationForm.endYear),
      };
      
      await profileApi.updateEducation(id, educationData);
      await refetchProfile(currentUserId); 
      resetEducationForm();
      setActiveForm(null);
    } catch (err) {
      console.error('Update education error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update education');
    } finally {
      setIsSavingEducation(false);
    }
  };

  const updateExperience = async (id: string) => {
    try {
      setIsSavingExperience(true);
      await profileApi.updateExperience(id, experienceForm);
      await refetchProfile(currentUserId);
      resetExperienceForm();
      setActiveForm(null);
    } catch (err) {
      console.error('Update experience error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update experience');
    } finally {
      setIsSavingExperience(false);
    }
  };

  const deleteEducation = async (id: string) => {
    try {
      setIsSavingEducation(true);
      await profileApi.deleteEducation(id);
      await refetchProfile(currentUserId); 
      setActiveForm(null);
    } catch (err) {
      console.error('Delete education error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete education');
    } finally {
      setIsSavingEducation(false);
    }
  };

  const deleteExperience = async (id: string) => {
    try {
      setIsSavingExperience(true);
      await profileApi.deleteExperience(id);
      await refetchProfile(currentUserId); 
      setActiveForm(null);
    } catch (err) {
      console.error('Delete experience error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete experience');
    } finally {
      setIsSavingExperience(false);
    }
  };

  const addSkill = async () => {
    if (profile && skillForm.name.trim() && !isAddingSkill) {
      const skillName = skillForm.name.trim();
      
      // Check if skill already exists
      const existingSkill = profile.skills?.find(skill => 
        skill.name.toLowerCase() === skillName.toLowerCase()
      );
      
      if (existingSkill) {
        alert('This skill already exists in your profile');
        return;
      }
      
      setIsAddingSkill(true);
      try {
        const skillData = { name: skillName };
        const response = await profileApi.addSkill(skillData);
        
        // Handle the response - it should contain the updated user with skills
        const updatedUser = response.data?.user || response.user;
        if (updatedUser) {
          const id = (updatedUser as any).id || (updatedUser as any)._id || profile.id;
          const profileWithId = {
            ...profile,
            ...updatedUser as UserProfile,
            id
          };
          setProfile(profileWithId);

          // Update localStorage if this is the current user's profile
          const currentUserId = getCurrentUserId();
          if (currentUserId && (id === currentUserId || (updatedUser as any)._id === currentUserId)) {
            localStorage.setItem('currentUser', JSON.stringify(profileWithId));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('profileUpdated'));
          }
        }
        
        setSkillForm({ name: '' });
        setActiveForm(null);
      } catch (error) {
        console.error('Error adding skill:', error);
        alert('Failed to add skill');
      } finally {
        setIsAddingSkill(false);
      }
    }
  };

  const deleteSkill = async (skillId: string) => {
    if (profile && skillId) {
      setIsAddingSkill(true);
      try {
        const response = await profileApi.deleteSkill(skillId);
        
        // Handle the response - it should contain the updated user with skills
        const updatedUser = response.data?.user || response.user;
        if (updatedUser) {
          const id = (updatedUser as any).id || (updatedUser as any)._id || profile.id;
          const profileWithId = {
            ...profile,
            ...updatedUser as UserProfile,
            id
          };
          setProfile(profileWithId);

          // Update localStorage if this is the current user's profile
          const currentUserId = getCurrentUserId();
          if (currentUserId && (id === currentUserId || (updatedUser as any)._id === currentUserId)) {
            localStorage.setItem('currentUser', JSON.stringify(profileWithId));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('profileUpdated'));
          }
        }
      } catch (error) {
        console.error('Error deleting skill:', error);
        alert('Failed to delete skill');
      } finally {
        setIsAddingSkill(false);
      }
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

  const handleMessage = () => {
    if (!profile) return;
    const userName = profile.name && profile.name !== 'User' && profile.name !== 'Unknown User' 
      ? encodeURIComponent(profile.name) 
      : '';
    router.push(`/chats?user=${profile.id}${userName ? `&name=${userName}` : ''}`);
  };

  const handleShareProfile = () => {
    setShowShareModal(true);
  };

  const copyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile?.id}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      alert('Profile link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Profile link copied to clipboard!');
    }
  };

  const shareViaEmail = () => {
    const profileUrl = `${window.location.origin}/profile/${profile?.id}`;
    const subject = `Check out ${profile?.name}'s profile on Cenopie`;
    const body = `Hi,\n\nI wanted to share ${profile?.name}'s professional profile with you:\n\n${profileUrl}\n\nBest regards`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaWhatsApp = () => {
    const profileUrl = `${window.location.origin}/profile/${profile?.id}`;
    const message = `Check out ${profile?.name}'s profile on Cenopie: ${profileUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  const shareViaLinkedIn = () => {
    const profileUrl = `${window.location.origin}/profile/${profile?.id}`;
    const text = `Check out ${profile?.name}'s profile on Cenopie`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(text)}`);
  };

  const shareViaTwitter = () => {
    const profileUrl = `${window.location.origin}/profile/${profile?.id}`;
    const text = `Check out ${profile?.name}'s profile on Cenopie`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`);
  };

  // --- Render ---

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingSkeleton variant="rectangular" />
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
      <div className="min-h-screen bg-gray-50 relative">
        {/* Background Banner - Full Width Breaking Out of Container */}
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-48 sm:h-56 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden">
          {/* Banner Image */}
          {bannerImagePreview ? (
            <Image 
              src={bannerImagePreview} 
              alt="Banner preview" 
              fill
              className="object-cover cursor-pointer"
              onClick={() => setShowBannerModal(true)}
            />
          ) : profile.bannerImage ? (
            <Image 
              src={profile.bannerImage} 
              alt="Banner" 
              fill
              className="object-cover cursor-pointer"
              onClick={() => setShowBannerModal(true)}
            />
          ) : null}
          
          {/* Banner Edit Overlay - Only show when editing, positioned to avoid profile image */}
          {isEditing && isOwnProfile && (
            <div className="absolute inset-0 z-20">
              {/* Banner edit button positioned in top-right corner, away from profile image */}
              <div className="absolute top-4 right-4">
                <Button
                  onClick={triggerBannerImageUpload}
                  size="sm"
                  className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm"
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  {profile.bannerImage || bannerImagePreview ? 'Change Banner' : 'Add Banner'}
                </Button>
              </div>
            </div>
          )}
          
          {/* Hidden file input for banner */}
          <input
            type="file"
            ref={bannerImageRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleImageChange(e, 'banner')}
          />
        </div>

        <div className="relative z-10 w-full flex justify-center px-4 lg:px-6 -mt-24 sm:-mt-28 md:-mt-32">
          <div className="w-full max-w-[1200px] pt-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Sidebar - Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-visible sticky top-6 relative">
                  {/* Profile Image positioned at top of card */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-10">
                    {isEditing && isOwnProfile ? (
                      <div 
                        className="relative w-36 h-36 bg-white rounded-full flex items-center justify-center cursor-pointer border-4 border-white shadow-xl"
                        onClick={triggerProfileImageUpload}
                      >
                        {profileImagePreview ? (
                          <Image 
                            src={profileImagePreview} 
                            alt="Profile preview" 
                            width={144}
                            height={144}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : profile.profileImage ? (
                          <Image 
                            src={profile.profileImage} 
                            alt="Profile" 
                            width={144}
                            height={144}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <UserIcon className="w-18 h-18 text-gray-400" />
                        )}
                        <div className="absolute bottom-0 right-0 bg-[#0BC0DF] rounded-full p-2">
                          <CameraIcon className="w-4 h-4 text-white" />
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
                      <div className="relative w-36 h-36 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                        {profile.profileImage ? (
                          <Image 
                            src={profile.profileImage} 
                            alt={profile.name} 
                            width={144}
                            height={144}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <UserIcon className="w-18 h-18 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Profile Info */}
                  <div className="pt-28 pb-6 px-6">
                    {isEditing && isOwnProfile ? (
                      <div className="space-y-3 mb-4">
                        <Input
                          value={basicInfoForm.name || ''}
                          onChange={(e) => setBasicInfoForm({...basicInfoForm, name: e.target.value})}
                          className="font-bold text-lg"
                          placeholder="Your Name"
                        />
                        <Input
                          value={basicInfoForm.headline || ''}
                          onChange={(e) => setBasicInfoForm({...basicInfoForm, headline: e.target.value})}
                          placeholder="Your Title"
                          className="text-gray-600"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                          <VerificationBadge isVerified={profile.isVerified} size="sm" />
                        </div>
                        {profile.headline && (
                          <p className="text-gray-600 text-sm mb-2">{profile.headline}</p>
                        )}
                      </>
                    )}
                    
                    {/* Location */}
                    {isEditing && isOwnProfile ? (
                      <Input
                        value={basicInfoForm.location || ''}
                        onChange={(e) => setBasicInfoForm({...basicInfoForm, location: e.target.value})}
                        placeholder="Location"
                        className="text-gray-500 text-sm mb-4"
                      />
                    ) : (
                      profile.location && (
                        <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                          <MapPinIcon className="w-4 h-4" />
                          {profile.location}
                        </p>
                      )
                    )}
                    
                    {/* Bio */}
                    {isEditing && isOwnProfile ? (
                      <Textarea
                        value={basicInfoForm.bio || ''}
                        onChange={(e) => setBasicInfoForm({...basicInfoForm, bio: e.target.value})}
                        placeholder="Tell us about yourself..."
                        className="text-sm text-gray-700 min-h-[80px] mb-4"
                      />
                    ) : (
                      profile.bio && (
                        <p className="text-sm text-gray-700 leading-relaxed mb-4">
                          {profile.bio}
                        </p>
                      )
                    )}
                    
                    {/* Action Buttons */}
                    <div className="mb-6">
                      {isEditing && isOwnProfile ? (
                        <div className="space-y-2">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile}
                            className="w-full bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingProfile ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <PencilIcon className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleEdit}
                            variant="outline"
                            disabled={isSavingProfile}
                            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          {!isOwnProfile && (
                            <div className="flex gap-2">
                              <Button
                                onClick={handleMessage}
                                variant="outline"
                                className="flex-1 gap-2"
                              >
                                <ChatBubbleLeftIcon className="w-4 h-4" />
                                Message
                              </Button>
                              {currentUserId && profile && (
                                <div className="flex-1">
                                  <ConnectButton
                                    userId={profile.id}
                                    userName={profile.name}
                                    currentUserId={currentUserId}
                                    initialStatus={(profile as any).connectionStatus || 'none'}
                                    initialConnectionId={(profile as any).connectionId || null}
                                    size="md"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          {isOwnProfile && (
                            <div className="space-y-2">
                              <Button
                                onClick={handleEdit}
                                className="w-full bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white"
                              >
                                <PencilIcon className="w-4 h-4 mr-2" />
                                Edit Profile
                              </Button>
                              <Button
                                onClick={handleShareProfile}
                                variant="outline"
                                className="w-full"
                              >
                                <ShareIcon className="w-4 h-4 mr-2" />
                                Share Profile
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Skills Section */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Skills</h3>
                        {isEditing && isOwnProfile && (
                          <Button
                            size="sm"
                            onClick={() => setActiveForm(activeForm === 'skills' ? null : 'skills')}
                            variant="ghost"
                            className="p-1"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {activeForm === 'skills' && isEditing && isOwnProfile && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <Input
                            placeholder="Skill name"
                            value={skillForm.name}
                            onChange={(e) => setSkillForm({...skillForm, name: e.target.value})}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && skillForm.name.trim() && !isAddingSkill) {
                                e.preventDefault();
                                addSkill();
                              }
                            }}
                            className="mb-2"
                            disabled={isAddingSkill}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveForm(null)}
                              disabled={isAddingSkill}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={addSkill}
                              disabled={!skillForm.name.trim() || isAddingSkill}
                            >
                              {isAddingSkill ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                                  Adding...
                                </>
                              ) : (
                                'Add'
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {profile.skills && profile.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {profile.skills.map((skill) => (
                            <div key={skill._id || skill.name} className="flex items-center">
                              <Badge 
                                variant="secondary" 
                                className="bg-[#0BC0DF]/10 text-[#0BC0DF] border-[#0BC0DF]/20 text-xs"
                              >
                                {skill.name}
                                {isEditing && isOwnProfile && (
                                  <button
                                    onClick={() => deleteSkill(skill._id || skill.name)}
                                    className="ml-1 text-red-500 hover:text-red-700"
                                  >
                                    <XMarkIcon className="w-3 h-3" />
                                  </button>
                                )}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs italic mb-4">No skills added yet.</p>
                      )}
                    </div>
                    
                    {/* Stats Section */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-1" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {profile.totalInterviews || 0}
                        </div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Total Interviews</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <svg className="w-5 h-5 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {profile.selectedInterviews || 0}
                        </div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Selected</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <svg className="w-5 h-5 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {profile.rejectedInterviews || 0}
                        </div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Rejected</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <svg className="w-5 h-5 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {profile.averageScore || 0}
                        </div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Content Area */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Work Experience */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BriefcaseIcon className="w-5 h-5 text-[#0BC0DF]" />
                        Work Experience
                      </h2>
                      {/* Only show Add button for own profile */}
                      {isOwnProfile && (
                        <Button
                          size="sm"
                          onClick={() => {
                            resetExperienceForm(); 
                            setActiveForm('experience-add'); 
                          }}
                          className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white text-xs px-3 py-1"
                        >
                          <PlusIcon className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    {/* Check for add form or an edit form */}
                    {(activeForm === 'experience-add' || activeForm?.startsWith('experience-edit-')) && isOwnProfile && (
                      <Card className="mb-4 border-[#0BC0DF]/20">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <Input
                              placeholder="Job Title"
                              value={experienceForm.jobTitle}
                              onChange={(e) => setExperienceForm({...experienceForm, jobTitle: e.target.value})}
                              className="text-sm"
                            />
                            <Input
                              placeholder="Company"
                              value={experienceForm.company}
                              onChange={(e) => setExperienceForm({...experienceForm, company: e.target.value})}
                              className="text-sm"
                            />
                            <Input
                              placeholder="Employment Type (e.g., Full-time, Freelance)"
                              value={experienceForm.employmentType}
                              onChange={(e) => setExperienceForm({...experienceForm, employmentType: e.target.value})}
                              className="text-sm"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                type="date"
                                placeholder="Start Date"
                                value={experienceForm.startDate}
                                onChange={(e) => setExperienceForm({...experienceForm, startDate: e.target.value})}
                                className="text-sm"
                              />
                              <Input
                                type="date"
                                placeholder="End Date"
                                value={experienceForm.endDate || ''}
                                onChange={(e) => setExperienceForm({...experienceForm, endDate: e.target.value})}
                                disabled={experienceForm.current}
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="currentJob"
                                checked={experienceForm.current}
                                onChange={(e) => setExperienceForm({...experienceForm, current: e.target.checked})}
                                className="mr-2 accent-[#0BC0DF]"
                              />
                              <label htmlFor="currentJob" className="text-xs">I currently work here</label>
                            </div>
                            <Textarea
                              placeholder="Description (Optional)"
                              value={experienceForm.description || ''}
                              onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})}
                              className="min-h-[60px] text-sm"
                            />
                          </div>
                          <div className="flex justify-end gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveForm(null)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (activeForm?.startsWith('experience-edit-')) {
                                  const experienceId = activeForm.split('experience-edit-')[1];
                                  updateExperience(experienceId);
                                } else {
                                  addExperience();
                                }
                              }}
                              disabled={!experienceForm.company || !experienceForm.jobTitle || !experienceForm.startDate || isSavingExperience}
                              className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSavingExperience ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                  Saving...
                                </>
                              ) : (
                                activeForm?.startsWith('experience-edit-') ? 'Update' : 'Add'
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                      
                    <div className="space-y-3">
                      {profile.experience && profile.experience.length > 0 ? (
                        <>
                          {profile.experience
                            .filter(exp => activeForm !== `experience-edit-${exp._id}`)
                            .map((exp) => (
                            <div key={exp._id} className="p-3 border border-gray-100 rounded-lg hover:border-[#0BC0DF]/30 transition-colors relative">
                              {isOwnProfile && exp._id && (
                                <div className="absolute top-2 right-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="ghost" className="p-1 h-auto">
                                        <EllipsisVerticalIcon className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onSelect={() => {
                                          setExperienceForm({
                                            company: exp.company || '',
                                            jobTitle: exp.jobTitle || '',
                                            employmentType: exp.employmentType || '',
                                            startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
                                            endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
                                            description: exp.description || '',
                                            current: exp.current || false
                                          });
                                          setActiveForm(`experience-edit-${exp._id}`);
                                        }}
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onSelect={() => deleteExperience(exp._id!)}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-start mb-2 pr-6">
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
                                {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : 'Unknown Date'} - {
                                  exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Unknown Date')
                                }
                              </p>
                              {exp.description && (
                                <p className="text-gray-600 text-xs mt-2 leading-relaxed">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                            ))}
                        </>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No work experience added yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <AcademicCapIcon className="w-5 h-5 text-[#0BC0DF]" />
                        Education
                      </h2>
                      {/* Only show Add button for own profile */}
                      {isOwnProfile && (
                        <Button
                          size="sm"
                          onClick={() => {
                            resetEducationForm(); 
                            setActiveForm('education-add'); 
                          }}
                          className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white text-xs px-3 py-1"
                        >
                          <PlusIcon className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    {/* Check for add form or an edit form */}
                    {(activeForm === 'education-add' || activeForm?.startsWith('education-edit-')) && isOwnProfile && (
                      <Card className="mb-4 border-[#0BC0DF]/20">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <Input
                              placeholder="College/University"
                              value={educationForm.college}
                              onChange={(e) => setEducationForm({...educationForm, college: e.target.value})}
                              className="text-sm"
                            />
                            <Input
                              placeholder="Degree"
                              value={educationForm.degree}
                              onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})}
                              className="text-sm"
                            />
                            <Input
                              placeholder="Field of Study"
                              value={educationForm.fieldOfStudy}
                              onChange={(e) => setEducationForm({...educationForm, fieldOfStudy: e.target.value})}
                              className="text-sm"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                type="number"
                                placeholder="Start Year"
                                value={educationForm.startYear || ''} 
                                onChange={(e) => setEducationForm({...educationForm, startYear: parseInt(e.target.value) || 0})}
                                className="text-sm"
                              />
                              <Input
                                type="number"
                                placeholder="End Year"
                                value={educationForm.endYear || ''} 
                                onChange={(e) => setEducationForm({...educationForm, endYear: parseInt(e.target.value) || 0})}
                                disabled={educationForm.current}
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="currentStudy"
                                checked={educationForm.current}
                                onChange={(e) => setEducationForm({...educationForm, current: e.target.checked})}
                                className="mr-2 accent-[#0BC0DF]"
                              />
                              <label htmlFor="currentStudy" className="text-xs">I currently study here</label>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveForm(null)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (activeForm?.startsWith('education-edit-')) {
                                  const educationId = activeForm.split('education-edit-')[1];
                                  updateEducation(educationId);
                                } else {
                                  addEducation();
                                }
                              }}
                              disabled={!educationForm.college || !educationForm.degree || isSavingEducation}
                              className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSavingEducation ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                  Saving...
                                </>
                              ) : (
                                activeForm?.startsWith('education-edit-') ? 'Update' : 'Add'
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                      
                    {profile.education && profile.education.length > 0 ? (
                      <div className="space-y-3">
                        {profile.education.map((edu) => (
                          // Only render the entry if it's not currently being edited
                          (activeForm !== `education-edit-${edu._id}`) && (
                            <div key={edu._id} className="p-3 border border-gray-100 rounded-lg hover:border-[#0BC0DF]/30 transition-colors relative">
                              {/* Only show edit/delete options for own profile */}
                              {isOwnProfile && edu._id && (
                                <div className="absolute top-2 right-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="p-1 h-auto"
                                      >
                                        <EllipsisVerticalIcon className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onSelect={() => {
                                          setEducationForm({
                                            college: edu.college || '',
                                            degree: edu.degree || '',
                                            fieldOfStudy: edu.fieldOfStudy || '',
                                            startYear: edu.startYear || new Date().getFullYear(),
                                            endYear: edu.endYear || new Date().getFullYear(),
                                            current: edu.current || false
                                          });
                                          setActiveForm(`education-edit-${edu._id}`);
                                        }}
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onSelect={() => deleteEducation(edu._id!)}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                              
                              <div className="pr-6">
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
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No education information added yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Licenses & Certifications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#0BC0DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Licenses & Certifications
                      </h2>
                      {/* Only show Add button for own profile */}
                      {isOwnProfile && (
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
                            setActiveForm('certification-add');
                          }}
                          className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white text-xs px-3 py-1"
                        >
                          <PlusIcon className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    {/* Certification Form */}
                    {(activeForm === 'certification-add' || activeForm?.startsWith('certification-edit-')) && isOwnProfile && (
                      <Card className="mb-4 border-[#0BC0DF]/20">
                        <CardContent className="p-4">
                          <h4 className="font-medium text-gray-900 mb-3">
                            {activeForm?.startsWith('certification-edit-') ? 'Edit License/Certification' : 'Add License/Certification'}
                          </h4>
                          <div className="space-y-3">
                            <Input
                              placeholder="Name (e.g., AWS Certified Solutions Architect)"
                              value={certificationForm.name}
                              onChange={(e) => setCertificationForm({...certificationForm, name: e.target.value})}
                              className="text-sm"
                            />
                            <Input
                              placeholder="Issuing Organization (e.g., Amazon Web Services)"
                              value={certificationForm.organization}
                              onChange={(e) => setCertificationForm({...certificationForm, organization: e.target.value})}
                              className="text-sm"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                type="date"
                                placeholder="Issue Date"
                                value={certificationForm.issueDate}
                                onChange={(e) => setCertificationForm({...certificationForm, issueDate: e.target.value})}
                                className="text-sm"
                              />
                              <Input
                                type="date"
                                placeholder="Expiration Date"
                                value={certificationForm.expirationDate}
                                onChange={(e) => setCertificationForm({...certificationForm, expirationDate: e.target.value})}
                                disabled={certificationForm.doesNotExpire}
                                className="text-sm"
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
                            <Input
                              placeholder="Credential ID (Optional)"
                              value={certificationForm.credentialId}
                              onChange={(e) => setCertificationForm({...certificationForm, credentialId: e.target.value})}
                              className="text-sm"
                            />
                            <Input
                              type="url"
                              placeholder="Credential URL (Optional)"
                              value={certificationForm.credentialUrl}
                              onChange={(e) => setCertificationForm({...certificationForm, credentialUrl: e.target.value})}
                              className="text-sm"
                            />
                          </div>
                          <div className="flex justify-end gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveForm(null)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  setLoading(true);
                                  let response;
                                  
                                  if (activeForm?.startsWith('certification-edit-')) {
                                    const certificationId = activeForm.split('certification-edit-')[1];
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
                                  setActiveForm(null);
                                } catch (error) {
                                  console.error('Error saving certification:', error);
                                  setError(error instanceof Error ? error.message : 'Failed to save certification');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              disabled={!certificationForm.name || !certificationForm.organization || !certificationForm.issueDate}
                              className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white text-xs"
                            >
                              {activeForm?.startsWith('certification-edit-') ? 'Update Certification' : 'Add Certification'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
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
                                {isOwnProfile && (
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
                                      setActiveForm(`certification-edit-${cert._id}`);
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs transition-colors"
                                  >
                                    Edit
                                  </button>
                                )}
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

                {/* Featured Activities - User Posts */}
                <Card className='lg:col-span-2'> 
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                      Featured Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserPostsSection userId={profile.id} isOwnProfile={isOwnProfile} currentUserId={currentUserId} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Share Profile Modal */}
        {showShareModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowShareModal(false)}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Share Profile</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={copyProfileLink}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-[#0BC0DF]/10 rounded-full flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-[#0BC0DF]" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Copy Link</div>
                    <div className="text-sm text-gray-500">Copy profile URL to clipboard</div>
                  </div>
                </button>

                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Email</div>
                    <div className="text-sm text-gray-500">Share via email</div>
                  </div>
                </button>

                <button
                  onClick={shareViaWhatsApp}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">WhatsApp</div>
                    <div className="text-sm text-gray-500">Share via WhatsApp</div>
                  </div>
                </button>

                <button
                  onClick={shareViaLinkedIn}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <BuildingOfficeIcon className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">LinkedIn</div>
                    <div className="text-sm text-gray-500">Share on LinkedIn</div>
                  </div>
                </button>

                <button
                  onClick={shareViaTwitter}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <AtSymbolIcon className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Twitter</div>
                    <div className="text-sm text-gray-500">Share on Twitter</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Image Modal */}
        {showBannerModal && (bannerImagePreview || profile.bannerImage) && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBannerModal(false)}
          >
            <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <button
                onClick={() => setShowBannerModal(false)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <img
                src={bannerImagePreview || profile.bannerImage || ''}
                alt="Banner"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default ProfilePage;