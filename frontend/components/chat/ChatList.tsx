'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/apiUrl';
import { useSocket } from '@/hooks/useSocket';
import VerificationBadge from '@/components/VerificationBadge';

interface Chat {
  id: string;
  participants: {
    id: string;
    name: string;
    profileImage?: string;
  }[];
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId: string | null;
}

export default function ChatList({ onChatSelect, selectedChatId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { socket } = useSocket();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user from localStorage with detailed debugging
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    console.log('🔍 User data debugging:');
    console.log('Token exists:', !!token);
    console.log('Raw user data from localStorage:', userData);
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('👤 Parsed user object:', user);
        console.log('User ID:', user.id || user._id, 'Type:', typeof (user.id || user._id));
        
        // Ensure consistent ID format
        const normalizedUser = {
          ...user,
          id: user.id || user._id
        };
        
        console.log('✅ Normalized user:', normalizedUser);
        setCurrentUser(normalizedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      console.log('❌ No user data found in localStorage');
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      setChats(prev => prev.map(chat => 
        chat.id === data.chatId 
          ? {
              ...chat,
              lastMessage: {
                content: data.content,
                createdAt: data.createdAt,
                senderId: data.senderId
              },
              unreadCount: data.senderId !== currentUser?.id ? chat.unreadCount + 1 : chat.unreadCount
            }
          : chat
      ));
    };

    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, currentUser?.id]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      console.log('🔑 Fetching chats with token:', token?.substring(0, 20) + '...');
      
      const response = await fetch(`${getApiUrl()}/api/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📨 Chats received from backend:', data.chats);
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    console.log('🔍 Finding other participant for chat:', chat.id);
    console.log('Current user ID:', currentUser?.id, 'Type:', typeof currentUser?.id);
    console.log('Chat participants:', chat.participants.map(p => ({ 
      id: p.id, 
      type: typeof p.id, 
      name: p.name 
    })));
    
    const otherParticipant = chat.participants.find(p => {
      const match = p.id !== currentUser?.id;
      console.log(`Comparing ${p.id} !== ${currentUser?.id} = ${match}`);
      return match;
    });
    
    console.log('Other participant found:', otherParticipant);
    
    return otherParticipant;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const filteredChats = chats.filter(chat => {
    const otherParticipant = getOtherParticipant(chat);
    const fullName = otherParticipant?.name?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chats</h1>
          <div className="flex items-center gap-2">
            {/* New chat button */}
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {/* Settings button */}
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Scrollable Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
            <div className="w-16 h-16 mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <h3 className="font-medium mb-1">No conversations yet</h3>
            <p className="text-sm text-center">Start a conversation by connecting with someone</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredChats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat);
              const isSelected = chat.id === selectedChatId;
              
              return (
                <div
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {otherParticipant?.profileImage ? (
                        <img 
                          src={otherParticipant.profileImage} 
                          alt={otherParticipant?.name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        otherParticipant?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
                      )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {otherParticipant?.name || 'Unknown User'}
                        </h3>
                        {otherParticipant?.isVerified && (
                          <VerificationBadge isVerified={true} size="sm" showTooltip={false} />
                        )}
                      </div>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                          {formatTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {chat.lastMessage ? (
                          <>
                            {chat.lastMessage.senderId === currentUser?.id && (
                              <span className="text-blue-600 dark:text-blue-400">You: </span>
                            )}
                            {chat.lastMessage.content}
                          </>
                        ) : (
                          'No messages yet'
                        )}
                      </p>
                      
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center flex-shrink-0">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}