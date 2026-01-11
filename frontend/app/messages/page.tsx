'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConversationList from '@/components/messages/ConversationList';
import ChatArea from '@/components/messages/ChatArea';
import { useMessaging } from '@/hooks/useMessaging';
import { Conversation, Message } from '@/lib/messageApi';
import { Button } from '@/components/ui/button';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get('conversation');
  const userParam = searchParams.get('user');

  const {
    conversations,
    messages,
    loading,
    error,
    isConnected,
    loadMessages,
    sendMessage,
    startTyping,
    stopTyping,
    markConversationAsRead,
    getOrCreateDirectConversation,
    getConversationMessages,
    getTypingUsersForConversation,
    getUserStatus
  } = useMessaging();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return currentUser._id || currentUser.id;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Handle URL parameters
  useEffect(() => {
    const handleUrlParams = async () => {
      if (userParam && !conversationParam) {
        // Create or get direct conversation with user
        try {
          const conversation = await getOrCreateDirectConversation(userParam);
          setSelectedConversation(conversation);
          
          // Update URL to use conversation ID
          const url = new URL(window.location.href);
          url.searchParams.delete('user');
          url.searchParams.set('conversation', conversation._id);
          window.history.replaceState({}, '', url.toString());
        } catch (error) {
          console.error('Failed to create conversation:', error);
        }
      } else if (conversationParam) {
        // Find conversation by ID
        const conversation = conversations.find(c => c._id === conversationParam);
        if (conversation) {
          setSelectedConversation(conversation);
        }
      }
    };

    if (conversations.length > 0) {
      handleUrlParams();
    }
  }, [conversationParam, userParam, conversations, getOrCreateDirectConversation]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const loadConversationMessages = async () => {
        setLoadingMessages(true);
        try {
          const response = await loadMessages(selectedConversation._id);
          setHasMoreMessages(response.pagination.hasMore);
          
          // Mark conversation as read
          await markConversationAsRead(selectedConversation._id);
        } catch (error) {
          console.error('Failed to load messages:', error);
          // Don't let loading errors block the UI
        } finally {
          // Always reset loading state
          setLoadingMessages(false);
        }
      };

      loadConversationMessages();
    } else {
      // Reset loading state when no conversation is selected
      setLoadingMessages(false);
    }
  }, [selectedConversation, loadMessages, markConversationAsRead]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('conversation', conversation._id);
    url.searchParams.delete('user');
    window.history.pushState({}, '', url.toString());
  };

  const handleSendMessage = async (content: string, replyTo?: string) => {
    if (!selectedConversation) return;

    try {
      await sendMessage({
        conversationId: selectedConversation._id,
        content,
        replyTo
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast
    }
  };

  const handleLoadMoreMessages = async () => {
    if (!selectedConversation || loadingMessages) return;

    setLoadingMessages(true);
    try {
      const currentMessages = getConversationMessages(selectedConversation._id);
      const page = Math.ceil(currentMessages.length / 50) + 1;
      
      const response = await loadMessages(selectedConversation._id, page);
      setHasMoreMessages(response.pagination.hasMore);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleTypingStart = () => {
    if (selectedConversation) {
      startTyping(selectedConversation._id);
    }
  };

  const handleTypingStop = () => {
    if (selectedConversation) {
      stopTyping(selectedConversation._id);
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.delete('conversation');
    url.searchParams.delete('user');
    window.history.pushState({}, '', url.toString());
  };

  const handleStartNewConversation = () => {
    router.push('/messages/new');
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search in conversation');
  };

  const handleArchive = () => {
    // TODO: Implement archive functionality
    console.log('Archive conversation');
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete conversation');
  };

  const handleDeleteMessage = (messageId: string, deleteForEveryone?: boolean) => {
    // TODO: Implement message deletion
    console.log('Delete message:', messageId, deleteForEveryone);
  };

  if (!currentUserId) {
    return (
      <div className="fixed inset-0 top-14 sm:top-16 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Please log in to access messages</p>
          <Button 
            onClick={() => router.push('/auth/login')}
            className="mt-4 bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 top-14 sm:top-16 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show loading only for initial conversations load, not for individual message loading
  if (loading && conversations.length === 0) {
    return (
      <div className="fixed inset-0 top-14 sm:top-16 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0BC0DF] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-14 sm:top-16 bg-gray-50 dark:bg-gray-900">
      <div className="w-full h-full flex justify-center">
        <div className="w-full lg:w-[1200px] flex flex-1 overflow-hidden mobile-safe-container">
          {/* Conversation List */}
          <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-gray-200 dark:border-gray-700`}>
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?._id}
              onSelectConversation={handleSelectConversation}
              onStartNewConversation={handleStartNewConversation}
              loading={loading}
              className="w-full"
            />
          </div>

          {/* Chat Area */}
          <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1`}>
            {selectedConversation ? (
              <ChatArea
                conversation={selectedConversation}
                messages={getConversationMessages(selectedConversation._id)}
                currentUserId={currentUserId}
                typingUsers={getTypingUsersForConversation(selectedConversation._id)}
                userStatus={selectedConversation.type === 'direct' ? getUserStatus(selectedConversation.otherParticipant?._id || '') : undefined}
                onSendMessage={handleSendMessage}
                onLoadMoreMessages={handleLoadMoreMessages}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
                onBack={handleBack}
                onSearch={handleSearch}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onDeleteMessage={handleDeleteMessage}
                loading={loadingMessages}
                hasMoreMessages={hasMoreMessages}
                className="w-full"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Choose a conversation from the sidebar to start messaging
                  </p>
                  <Button
                    onClick={handleStartNewConversation}
                    className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white"
                  >
                    Start new conversation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="fixed bottom-20 lg:bottom-4 left-4 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm">Reconnecting...</span>
          </div>
        </div>
      )}
    </div>
  );
}