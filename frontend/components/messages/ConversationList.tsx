'use client';

import React, { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Conversation } from '@/lib/messageApi';
import { formatDistanceToNow } from 'date-fns';
import VerificationBadge from '@/components/VerificationBadge';

// ConversationList component props - updated to remove onStartNewConversation
interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  loading?: boolean;
  className?: string;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading = false,
  className = ''
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter conversations based on search term
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    
    const term = searchTerm.toLowerCase();
    return conversations.filter(conversation => {
      const name = conversation.name || conversation.otherParticipant?.name || '';
      const lastMessageContent = conversation.lastMessage?.content || '';
      
      return name.toLowerCase().includes(term) || 
             lastMessageContent.toLowerCase().includes(term);
    });
  }, [conversations, searchTerm]);

  // Sort conversations by last activity
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  }, [filteredConversations]);

  const formatLastMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    return conversation.otherParticipant?.name || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.avatar;
    }
    return conversation.otherParticipant?.profileImage;
  };

  const getConversationInitials = (conversation: Conversation) => {
    const name = getConversationName(conversation);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isVerified = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return false; // Groups don't have verification
    }
    return conversation.otherParticipant?.isVerified || false;
  };

  if (loading) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h1>
        </div>
        
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start a conversation by messaging someone from their profile'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedConversations.map((conversation) => (
              <div
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedConversationId === conversation._id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={getConversationAvatar(conversation)} 
                        alt={getConversationName(conversation)}
                      />
                      <AvatarFallback className="bg-[#0BC0DF] text-white font-medium">
                        {getConversationInitials(conversation)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Online status indicator for direct conversations */}
                    {conversation.type === 'direct' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {getConversationName(conversation)}
                        </h3>
                        {isVerified(conversation) && (
                          <VerificationBadge isVerified={true} size="sm" />
                        )}
                        {conversation.type === 'group' && (
                          <Badge variant="secondary" className="text-xs">
                            {conversation.participantCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatLastMessageTime(conversation.lastActivity)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white min-w-[20px] h-5 text-xs flex items-center justify-center">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}