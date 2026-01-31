'use client';

import { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '@/lib/apiUrl';
import { useSocket } from '@/hooks/useSocket';
import VerificationBadge from '@/components/VerificationBadge';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  type: 'text' | 'image';
  readBy?: Array<{ userId: string; readAt: string }>;
}

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
}

export default function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocket();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newMessageIndicatorIndex, setNewMessageIndicatorIndex] = useState<number | null>(null);
  const [indicatorTimer, setIndicatorTimer] = useState<NodeJS.Timeout | null>(null);

  // Helper function to set indicator with auto-disappear timer
  const setIndicatorWithTimer = (index: number) => {
    // Clear any existing timer
    if (indicatorTimer) {
      clearTimeout(indicatorTimer);
    }
    
    // Set the indicator
    setNewMessageIndicatorIndex(index);
    
    // Set new timer to remove indicator after 10 seconds
    const timer = setTimeout(() => {
      setNewMessageIndicatorIndex(null);
      markAsRead(); // Also mark as read when timer expires
    }, 10000); // 10 seconds
    
    setIndicatorTimer(timer);
  };

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (chatId && currentUser) {
      setLoading(true); // Show skeleton every time chatId changes
      fetchMessages();
      markAsRead();
    }
  }, [chatId, currentUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Always jump to bottom instantly - no scrolling animation
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!socket || !chatId) {
      return;
    }

    // Join the specific chat room
    socket.emit('chat:join', chatId);

    const handleNewMessage = (data: any) => {
      if (data.chatId === chatId) {
        // Check if this message is from the current user (sender)
        const isFromCurrentUser = data.senderId === currentUser?.id;
        
        // Only show indicator if message is NOT from current user (i.e., we are the receiver)
        let shouldShowIndicator = false;
        
        if (!isFromCurrentUser) {
          // Check if user is scrolled up
          const container = messagesContainerRef.current;
          if (container) {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
            
            // Consider user scrolled up if they're more than 100px from bottom
            shouldShowIndicator = distanceFromBottom > 100;
          }
        }
        
        // Add new message
        setMessages(prev => {
          const newMessages = [...prev, {
            id: data.id,
            content: data.content,
            senderId: data.senderId,
            createdAt: data.createdAt,
            type: data.type || 'text'
          }];
          return newMessages;
        });
        
        // Set indicator only if we should show it (receiver + scrolled up)
        if (shouldShowIndicator) {
          setTimeout(() => {
            setIndicatorWithTimer(messages.length);
          }, 50);
        }
        
        markAsRead();
      }
    };

    const handleChatJoined = (data: any) => {
      // Chat joined successfully
    };

    socket.on('new_message', handleNewMessage);
    socket.on('chat:joined', handleChatJoined);
    
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('chat:joined', handleChatJoined);
      socket.emit('chat:leave', chatId);
    };
  }, [socket, chatId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (indicatorTimer) {
        clearTimeout(indicatorTimer);
      }
    };
  }, [indicatorTimer]);

  // Fallback: Refresh messages periodically if socket is not connected
  useEffect(() => {
    if (!socket || !isConnected) {
      // If socket is not connected, poll for new messages every 3 seconds
      const pollInterval = setInterval(() => {
        if (chatId && currentUser) {
          fetchMessages();
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [socket, isConnected, chatId, currentUser]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/api/chats/${chatId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Keep normal order (oldest to newest)
        setMessages(data.messages || []);
        setOtherUser(data.otherUser);
        
        // Simple approach: Show line before the last message if there are messages
        // and the last message is from someone else
        const messages = data.messages || [];
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          const isLastMessageFromOther = lastMessage.senderId !== currentUser?.id;
          
          if (isLastMessageFromOther) {
            setIndicatorWithTimer(messages.length - 1);
          } else {
            setNewMessageIndicatorIndex(null);
          }
        } else {
          setNewMessageIndicatorIndex(null);
        }
        
        // Immediately jump to bottom (where newest messages are)
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false); // Hide skeleton after messages are loaded
    }
  };

  const markAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/api/chats/${chatId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        // Clear timer and remove the line indicator when messages are marked as read
        if (indicatorTimer) {
          clearTimeout(indicatorTimer);
          setIndicatorTimer(null);
        }
        setNewMessageIndicatorIndex(null);
        
        // Dispatch event to update navbar chat count
        window.dispatchEvent(new CustomEvent('chatUpdate'));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const url = `${getApiUrl()}/api/chats/${chatId}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: messageContent,
          type: 'text'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Message will be added via socket event
        
        // Fallback: If socket is not connected, manually refresh messages
        if (!socket || !isConnected) {
          setTimeout(() => {
            fetchMessages();
          }, 500); // Small delay to ensure message is saved
        }
      } else {
        const errorData = await response.text();
        console.error('Failed to send message:', response.status, errorData);
        // Restore message on error
        setNewMessage(messageContent);
        
        // Try to parse error as JSON
        try {
          const errorJson = JSON.parse(errorData);
          console.error('Error details:', errorJson);
        } catch (e) {
          console.error('Raw error response:', errorData);
        }
      }
    } catch (error) {
      console.error('Network error sending message:', error);
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        {/* Skeleton Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center">
            {onBack && (
              <button
                onClick={onBack}
                className="mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <div className="flex items-center">
              {/* Skeleton Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mr-3"></div>
              
              <div className="flex items-center gap-2">
                {/* Skeleton Name */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
              </div>
            </div>
          </div>

          {/* Skeleton Action Button */}
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>

        {/* Skeleton Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-gray-900">
          {/* Generate multiple skeleton messages */}
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              {/* Skeleton Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              </div>

              {/* Skeleton Message Content */}
              <div className="flex-1 min-w-0">
                {/* Skeleton Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
                </div>
                
                {/* Skeleton Message Text */}
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
                  {index % 3 === 0 && (
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Message Input */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            {/* Skeleton Attachment Button */}
            <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            
            {/* Skeleton Input */}
            <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            
            {/* Skeleton Send Button */}
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold mr-3">
              {otherUser?.profileImage ? (
                <img 
                  src={otherUser.profileImage} 
                  alt={otherUser?.name || `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                `${otherUser?.firstName?.[0]}${otherUser?.lastName?.[0]}`
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {otherUser?.name || `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 'User'}
              </h2>
              {otherUser?.isVerified && (
                <VerificationBadge isVerified={true} size="sm" showTooltip={false} />
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* More Options */}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-gray-900"
        style={{ scrollBehavior: 'auto' }}
      >
        {messages.map((message, index) => {
          // Validate message structure
          if (!message.id) {
            console.warn('Message without ID detected:', message);
          }
          
          const isOwn = message.senderId === currentUser?.id;
          const previousMessage = index > 0 ? messages[index - 1] : undefined;
          const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
          
          // Create a unique key using message ID, timestamp, and index as fallbacks
          const messageKey = message.id || `${message.senderId}-${message.createdAt}-${index}`;

          // Get sender info
          const senderName = isOwn 
            ? `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.name || 'You'
            : `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || otherUser?.name || 'User';
          
          const senderAvatar = isOwn ? currentUser?.profileImage : otherUser?.profileImage;

          return (
            <div key={messageKey}>
              {showDateSeparator && (
                <div className="flex justify-center my-6">
                  <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 rounded-full font-medium">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              )}
              
              {/* Show simple line indicator where new messages start */}
              {newMessageIndicatorIndex === index && (
                <div className="flex items-center my-4">
                  <div className="flex-1 h-px bg-blue-300 dark:bg-blue-600"></div>
                  <div className="px-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 h-px bg-blue-300 dark:bg-blue-600"></div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {senderAvatar ? (
                      <img 
                        src={senderAvatar} 
                        alt={senderName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* Header with name and timestamp */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {senderName}
                    </span>
                    
                    {/* Verification Badge - Only show if user is verified */}
                    {(isOwn ? currentUser?.isVerified : otherUser?.isVerified) && (
                      <VerificationBadge isVerified={true} size="sm" showTooltip={false} />
                    )}
                    
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    
                    {/* Timestamp */}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  
                  {/* Message text */}
                  <div className="text-gray-900 dark:text-white text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <form onSubmit={sendMessage} className="flex items-center space-x-3">
          {/* Attachment Button */}
          <button
            type="button"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
            />
            
            {/* Emoji Button */}
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
          >
            {sending ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}