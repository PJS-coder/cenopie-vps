"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserIcon, ArrowRightOnRectangleIcon, BookmarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';

export default function ProfileDropdown() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Function to get profile image from localStorage
  const updateProfileImage = () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      console.log('🔍 ProfileDropdown Debug - Raw currentUser:', currentUser);
      
      if (currentUser) {
        const user = JSON.parse(currentUser);
        console.log('🔍 ProfileDropdown Debug - Parsed user:', user);
        
        const image = user.profileImage || null;
        console.log('🔍 ProfileDropdown Debug - Raw profileImage:', image);
        console.log('🔍 ProfileDropdown Debug - Image type:', typeof image);
        
        // Only use valid image URLs, filter out placeholder/default values
        const validImage = image && 
          typeof image === 'string' &&
          image.trim() !== '' && 
          image !== 'default' && 
          image !== '/default-avatar.png' && 
          !image.includes('placeholder') ? image : null;
        
        console.log('🔍 ProfileDropdown Debug - Valid image after filtering:', validImage);
        console.log('🔍 ProfileDropdown Debug - Filter conditions:');
        console.log('  - Not "default":', image !== 'default');
        console.log('  - Not "/default-avatar.png":', image !== '/default-avatar.png');
        console.log('  - No "placeholder":', !image?.includes('placeholder'));
        console.log('  - Not empty after trim:', image?.trim() !== '');
        
        setProfileImage(validImage);
        setUserId(user._id || user.id || null);
        setIsAdmin(user.role === 'admin' || user.isAdmin === true);
      } else {
        console.log('🔍 ProfileDropdown Debug - No currentUser in localStorage');
        setProfileImage(null);
        setUserId(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('ProfileDropdown: Error parsing currentUser', error);
      setProfileImage(null);
      setUserId(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Update immediately
    updateProfileImage();

    // Listen for storage changes and profile updates
    const handleStorageChange = () => {
      updateProfileImage();
    };

    const handleProfileUpdate = () => {
      updateProfileImage();
    };

    // Check periodically for updates (less frequent)
    const interval = setInterval(updateProfileImage, 2000);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const handleProfileClick = () => {
    if (userId) {
      router.push(`/profile/${userId}`);
    } else {
      router.push('/profile');
    }
    setIsOpen(false);
  };

  const handleSavedItemsClick = () => {
    router.push('/saved');
    setIsOpen(false);
  };



  const handleAdminClick = () => {
    router.push('/secure-admin');
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    router.refresh?.();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
            {(() => {
              console.log('🎨 Avatar Render - profileImage state:', profileImage);
              console.log('🎨 Avatar Render - Will show image?', !!profileImage);
              return null;
            })()}
            {profileImage ? (
              <AvatarImage 
                src={profileImage} 
                alt="Profile" 
                onError={(e) => {
                  console.log('❌ Image failed to load:', profileImage, e);
                  // If image fails to load, clear it from state to show fallback
                  setProfileImage(null);
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', profileImage);
                }}
              />
            ) : null}
            <AvatarFallback className="bg-[#0BC0DF] text-white">
              <UserIcon className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 sm:w-56">
        <DropdownMenuItem className="py-2.5 sm:py-2 cursor-pointer" onClick={handleProfileClick}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="py-2.5 sm:py-2 cursor-pointer" onClick={handleSavedItemsClick}>
          <BookmarkIcon className="mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">Saved Items</span>
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem className="py-2.5 sm:py-2 cursor-pointer" onClick={handleAdminClick}>
            <ShieldCheckIcon className="mr-2 h-4 w-4" />
            <span className="text-sm sm:text-base">Admin Panel</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 py-2.5 sm:py-2 cursor-pointer" onClick={handleLogoutClick}>
          <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}