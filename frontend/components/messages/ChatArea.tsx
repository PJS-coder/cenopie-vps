'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeftIcon, 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { Conversation, Message } from '@/lib/messageApi';
import VerificationBadge from '@/components/VerificationBadge';

interface ChatAreaProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  typingUsers: Array<{ userId: string; userName: string }>;
  userStatus?: 'online' | 'away' | 'busy' | 'offline';
  onSendMessage: (content: string, replyTo?: string) => void;
  onLoadMoreMessages: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onBack: () => void;
  onSearch: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onDeleteMessage: (messageId: string, deleteForEveryone?: boolean) => void;
  loading?: boolean;
  hasMoreMessages?: boolean;
  className?: string;
}

export default function ChatArea({
  conversation,
  messages,
  currentUserId,
  typingUsers,
  userStatus = 'offline',
  onSendMessage,
  onLoadMoreMessages,
  onTypingStart,
  onTypingStop,
  onBack,
  onSearch,
  onArchive,
  onDelete,
  onDeleteMessage,
  loading = false,
  hasMoreMessages = false,
  className = ''
}: ChatAreaProps) {
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto' 
    });
  }, []);

  // Remove the separate checkScrollPosition function since it's now integrated into handleScroll

  // Handle scroll events with debouncing
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // Update scroll to bottom button visibility with debouncing to prevent flickering
    const shouldShowButton = !isNearBottom;
    if (showScrollToBottom !== shouldShowButton) {
      setShowScrollToBottom(shouldShowButton);
    }
    
    // Track user scrolling
    isUserScrollingRef.current = true;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset user scrolling flag after scroll stops
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);
    
    // REMOVED: Automatic load more on scroll to prevent flickering
    // Users must now manually click "Load older messages" button
  }, [showScrollToBottom]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    scrollToBottom(false);
    prevMessageCountRef.current = messages.length;
  }, [conversation._id, scrollToBottom]);

  // Handle new messages - only auto-scroll if user is near bottom or sent the message
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage.sender._id === currentUserId;
      
      // Always scroll for own messages, or if user is near bottom
      if (isOwnMessage || !showScrollToBottom) {
        scrollToBottom();
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, currentUserId, showScrollToBottom, scrollToBottom]);

  // Simplified intersection observer - remove it since we're handling load more in scroll handler
  // The intersection observer was conflicting with manual scroll handling

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const getConversationName = () => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    return conversation.otherParticipant?.name || 'Unknown User';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'group') {
      return conversation.avatar;
    }
    return conversation.otherParticipant?.profileImage;
  };

  const getStatusText = () => {
    if (conversation.type === 'group') {
      return `${conversation.participantCount} members`;
    }
    
    switch (userStatus) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return 'Last seen recently';
    }
  };

  const getStatusColor = () => {
    switch (userStatus) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const isVerified = () => {
    if (conversation.type === 'group') return false;
    return conversation.otherParticipant?.isVerified || false;
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleClearReply = () => {
    setReplyToMessage(null);
  };

  const handleSendMessage = (content: string, replyTo?: string) => {
    onSendMessage(content, replyTo || replyToMessage?._id);
    setReplyToMessage(null);
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Fixed Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[60px]">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {/* Back button (mobile) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="md:hidden w-8 h-8 p-0 flex-shrink-0"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-8 h-8 md:w-10 md:h-10">
              <AvatarImage 
                src={getConversationAvatar()} 
                alt={getConversationName()}
              />
              <AvatarFallback className="bg-[#0BC0DF] text-white text-sm">
                {getConversationName().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Status indicator */}
            {conversation.type === 'direct' && (
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 ${getStatusColor()} border-2 border-white dark:border-gray-800 rounded-full`}></div>
            )}
          </div>

          {/* Name and status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate text-sm md:text-base">
                {getConversationName()}
              </h2>
              {isVerified() && (
                <VerificationBadge isVerified={true} size="sm" />
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
              {typingUsers.length > 0 ? (
                <span className="text-[#0BC0DF]">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].userName} is typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </span>
              ) : (
                getStatusText()
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearch}
            className="w-8 h-8 p-0 hidden md:flex"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <EllipsisVerticalIcon className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onSearch} className="md:hidden">
                <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                Search in conversation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                Archive conversation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                Delete conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scrollable Messages Area - Improved mobile performance */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-900"
        style={{ 
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        {/* Load more button */}
        {hasMoreMessages && (
          <div className="flex justify-center py-4">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0BC0DF] border-t-transparent"></div>
                <span className="text-sm">Loading older messages...</span>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (isLoadingMore) return;
                  setIsLoadingMore(true);
                  try {
                    const currentScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
                    await onLoadMoreMessages();
                    setTimeout(() => {
                      if (messagesContainerRef.current) {
                        const newScrollHeight = messagesContainerRef.current.scrollHeight;
                        const heightDifference = newScrollHeight - currentScrollHeight;
                        messagesContainerRef.current.scrollTop = heightDifference + 100;
                      }
                    }, 100);
                  } catch (error) {
                    console.error('Failed to load more messages:', error);
                  } finally {
                    setTimeout(() => setIsLoadingMore(false), 500);
                  }
                }}
                className="text-[#0BC0DF] hover:bg-[#0BC0DF]/10 px-4 py-2"
                disabled={isLoadingMore}
              >
                Load older messages
              </Button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="px-4 pb-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="mb-4">
              {/* Date header */}
              <div className="flex justify-center mb-3">
                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {formatDateHeader(date)}
                  </span>
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-0.5 md:space-y-1">
                {dateMessages.map((message, index) => {
                  const isOwn = message.sender._id === currentUserId;
                  const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                  const nextMessage = index < dateMessages.length - 1 ? dateMessages[index + 1] : null;
                  
                  const showAvatar = !prevMessage || prevMessage.sender._id !== message.sender._id;
                  const showTimestamp = !nextMessage || 
                    nextMessage.sender._id !== message.sender._id ||
                    new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 5 * 60 * 1000;

                  return (
                    <MessageBubble
                      key={`${message._id}-${index}-${date}`}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showTimestamp={showTimestamp}
                      currentUserId={currentUserId}
                      onReply={handleReply}
                      onDelete={onDeleteMessage}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-500">
                {typingUsers.length === 1 
                  ? `${typingUsers[0].userName} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          )}
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <div className="absolute bottom-20 right-4 z-40">
          <Button
            onClick={() => scrollToBottom()}
            className="w-10 h-10 rounded-full bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white shadow-lg"
          >
            ↓
          </Button>
        </div>
      )}

      {/* Fixed Message Input */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStart={onTypingStart}
          onTypingStop={onTypingStop}
          replyToMessage={replyToMessage}
          onClearReply={handleClearReply}
          disabled={false}
        />
      </div>
    </div>
  );
}