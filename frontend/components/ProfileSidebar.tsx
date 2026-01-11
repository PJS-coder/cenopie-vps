'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ChatBubbleLeftIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import VerificationBadge from '@/components/VerificationBadge';
import ConnectButton from '@/components/ConnectButton';
import { profileApi } from '@/lib/api';

interface ProfileSidebarProps {
  userId: string;
  currentUserId: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  role?: string | null;
  company?: string | null;
  college?: string | null;
  profileImage?: string | null;
  bannerImage?: string | null;
  isVerified?: boolean;
  followers?: string[];
  following?: string[];
  connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self';
  connectionId?: string | null;
}

export default function ProfileSidebar({ userId, currentUserId }: ProfileSidebarProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isOwnProfile = currentUserId && currentUserId === userId;

  // Helper function to get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = userId 
          ? await profileApi.getProfileById(userId)
          : await profileApi.getProfile();
          
        const userProfile = response.data?.user || response.user;
        
        if (userProfile) {
          const id = (userProfile as any).id || (userProfile as any)._id || '';
          const mappedProfile: UserProfile = {
            ...userProfile as UserProfile, 
            id,
          };
          setProfile(mappedProfile);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleMessage = () => {
    if (!profile) return;
    const userName = profile.name && profile.name !== 'User' && profile.name !== 'Unknown User' 
      ? encodeURIComponent(profile.name) 
      : '';
    router.push(`/messages?user=${profile.id}${userName ? `&name=${userName}` : ''}`);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-pulse">
        <div className="h-24 bg-gray-200"></div>
        <div className="p-5 pt-10">
          <div className="flex flex-col items-center text-center">
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="lg:sticky lg:top-[80px] space-y-6">
      {/* User Profile Banner Card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Banner Image */}
        <div 
          className="relative h-24 w-full cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => router.push(`/profile/${profile.id}`)}
          title="View profile"
        >
          {profile.bannerImage ? (
            <Image 
              src={profile.bannerImage} 
              alt="Profile banner" 
              className="w-full h-full object-cover"
              fill
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
          )}
          {/* Profile Image - centered horizontally */}
          <div 
            className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white bg-white cursor-pointer hover:scale-105 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${profile.id}`);
            }}
            title="View profile"
          >
            {profile.profileImage ? (
              <Image 
                src={profile.profileImage} 
                alt={profile.name}
                className="w-full h-full rounded-full object-cover"
                width={80}
                height={80}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#E6F7FC] flex items-center justify-center text-[#0BC0DF] font-semibold">
                {getUserInitials(profile.name || 'U')}
              </div>
            )}
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="p-5 pt-10">
          <div className="flex flex-col items-center text-center">
            <h4 
              className="font-semibold text-gray-900 flex items-center justify-center space-x-2 cursor-pointer hover:text-[#0BC0DF] transition-colors"
              onClick={() => router.push(`/profile/${profile.id}`)}
              title="View profile"
            >
              <span>{profile.name}</span>
              <VerificationBadge isVerified={profile.isVerified} size="md" />
            </h4>
            <p className="text-sm text-gray-600 mt-1">{profile.role || profile.headline || 'Professional'}</p>
            {(() => {
              // Show company if available, otherwise show college, otherwise nothing
              const displayText = profile.company || profile.college;
              return displayText ? (
                <p className="text-xs text-gray-500 mt-1">{displayText}</p>
              ) : null;
            })()}
            {profile.bio && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-3">{profile.bio}</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-500">Connections</span>
              <span className="font-medium text-gray-900">
                {profile.followers?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        {!isOwnProfile ? (
          <div className="space-y-3">
            {/* Message and Connect buttons in same row */}
            <div className="flex gap-2">
              <Button
                onClick={handleMessage}
                variant="ghost"
                className="flex-1 justify-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-gray-50 transition-colors"
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
                    initialStatus={profile.connectionStatus || 'none'}
                    initialConnectionId={profile.connectionId || null}
                    size="md"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={() => router.push(`/profile/${profile.id}`)}
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}