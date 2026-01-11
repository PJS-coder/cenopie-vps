'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useMessaging } from '@/hooks/useMessaging';
import { profileApi, searchApi } from '@/lib/api';
import VerificationBadge from '@/components/VerificationBadge';

interface User {
  _id: string;
  name: string;
  profileImage?: string;
  isVerified?: boolean;
  headline?: string;
}

export default function NewMessagePage() {
  const router = useRouter();
  const { getOrCreateDirectConversation } = useMessaging();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        // Use the search API to find users
        const response = await searchApi.search(searchTerm, 'users');
        const users = (response.data || []).map(result => ({
          _id: result.id,
          name: result.name,
          profileImage: result.profileImage,
          isVerified: result.isVerified || false,
          headline: result.headline
        }));
        setSearchResults(users);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleStartConversation = async (user: User) => {
    setCreating(true);
    try {
      const conversation = await getOrCreateDirectConversation(user._id);
      router.push(`/messages?conversation=${conversation._id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // TODO: Show error toast
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 top-14 sm:top-16 bg-white dark:bg-gray-900">
      <div className="w-full h-full flex justify-center">
        <div className="w-full max-w-2xl flex flex-col mobile-safe-container">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="w-8 h-8 p-0"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                New Message
              </h1>
            </div>

            {/* Search input */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                autoFocus
              />
            </div>
          </div>

          {/* Search results */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleStartConversation(user)}
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={user.profileImage} 
                          alt={user.name}
                        />
                        <AvatarFallback className="bg-[#0BC0DF] text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {user.name}
                          </h3>
                          {user.isVerified && (
                            <VerificationBadge isVerified={true} size="sm" />
                          )}
                        </div>
                        {user.headline && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {user.headline}
                          </p>
                        )}
                      </div>

                      {creating ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#0BC0DF] border-t-transparent"></div>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white"
                        >
                          Message
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm.trim() && !loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No users found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try searching with a different name or keyword
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Search for people
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter a name to find people you can message
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}