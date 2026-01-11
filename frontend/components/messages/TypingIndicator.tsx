'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TypingUser {
  userId: string;
  userName: string;
  userAvatar?: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
  className?: string;
}

export default function TypingIndicator({ users, className = '' }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const firstUser = users[0];

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="w-8 h-8">
          <AvatarImage 
            src={firstUser.userAvatar} 
            alt={firstUser.userName}
          />
          <AvatarFallback className="bg-[#0BC0DF] text-white text-xs">
            {firstUser.userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Typing bubble */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 max-w-[200px]">
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}