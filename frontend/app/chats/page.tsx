'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import { useSocket } from '@/hooks/useSocket';
import { createOrGetChat, getUserById } from '@/lib/chatUtils';
import { useToastContext } from '@/components/ToastProvider';

export default function ChatsPage() {
  return (
    <ProtectedRoute>
      <ChatsContent />
    </ProtectedRoute>
  );
}

function ChatsContent() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastContext();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle user parameter for starting new chats
  useEffect(() => {
    const targetUserId = searchParams.get('user');
    
    if (targetUserId && !isCreatingChat) {
      handleStartChatWithUser(targetUserId);
    }
  }, [searchParams, isCreatingChat]);

  const handleStartChatWithUser = async (userId: string) => {
    if (isCreatingChat) return;
    
    console.log('🚀 Starting chat with user ID:', userId);
    
    try {
      setIsCreatingChat(true);
      
      // Get user info for display
      const userInfo = await getUserById(userId);
      const userName = userInfo ? userInfo.name : 'Unknown User';
      
      console.log('👤 User info retrieved:', userInfo);
      
      // Create or get existing chat
      const chat = await createOrGetChat(userId);
      
      console.log('💬 Chat created/retrieved:', chat);
      
      // Select the chat
      setSelectedChatId(chat.id);
      
      // Clean up URL
      router.replace('/chats', { scroll: false });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      // Clean up URL even on error
      router.replace('/chats', { scroll: false });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
  };

  return (
    <div className="flex bg-white dark:bg-gray-900 fixed top-14 sm:top-16 left-0 right-0 bottom-0 z-40">
      {/* Loading overlay when creating chat */}
      {isCreatingChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 dark:text-white">Starting chat...</span>
          </div>
        </div>
      )}

      {/* Chat List - Hidden on mobile when chat is selected */}
      <div className={`${
        isMobile && selectedChatId ? 'hidden' : 'flex'
      } w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 flex-col bg-white dark:bg-gray-900`}>
        <ChatList 
          onChatSelect={handleChatSelect}
          selectedChatId={selectedChatId}
        />
      </div>

      {/* Chat Window - Hidden on mobile when no chat selected */}
      <div className={`${
        isMobile && !selectedChatId ? 'hidden' : 'flex'
      } flex-1 flex-col bg-gray-50 dark:bg-gray-800`}>
        {selectedChatId ? (
          <ChatWindow 
            chatId={selectedChatId}
            onBack={isMobile ? handleBackToList : undefined}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Select a chat</h3>
              <p className="text-sm">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}