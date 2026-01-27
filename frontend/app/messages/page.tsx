'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConversationList from '@/components/messages/ConversationList';
import ChatArea from '@/components/messages/ChatArea';
import { useMessaging } from '@/hooks/useMessaging';
import { Conversation, Message } from '@/lib/messageApi';
import { Button } from '@/components/ui/button';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

import SimpleLoader from '@/components/SimpleLoader';

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
    isReconnecting,
    connectionError,
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
  const [creatingConversation, setCreatingConversation] = useState(false);

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
          console.log('Creating conversation with user:', userParam);
          setCreatingConversation(true);
          const conversation = await getOrCreateDirectConversation(userParam);
          console.log('Conversation created/found:', conversation);
          setSelectedConversation(conversation);
          
          // Update URL to use conversation ID
          const url = new URL(window.location.href);
          url.searchParams.delete('user');
          url.searchParams.set('conversation', conversation._id);
          window.history.replaceState({}, '', url.toString());
        } catch (error) {
          console.error('Failed to create conversation:', error);
        } finally {
          setCreatingConversation(false);
        }
      } else if (conversationParam) {
        // Find conversation by ID
        const conversation = conversations.find(c => c._id === conversationParam);
        if (conversation) {
          setSelectedConversation(conversation);
        }
      }
    };

    // Run URL parameter handling regardless of existing conversations
    // This allows creating new conversations even if user has no existing ones
    if (userParam || conversationParam) {
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
  if ((loading && conversations.length === 0) || creatingConversation) {
    return (
      <div className="fixed inset-0 top-14 sm:top-16 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <SimpleLoader 
          size="lg" 
          showText={true} 
          text={creatingConversation ? 'Starting conversation...' : 'Loading conversations...'} 
        />
      </div>
    );
  }

  return (
    <div className="messages-page-lock bg-white dark:bg-gray-900">
      {/* Mobile-first responsive container */}
      <div className="flex h-full overflow-hidden">
        {/* Conversation List - Full width on mobile, sidebar on desktop */}
        <div className={`${
          selectedConversation 
            ? 'hidden md:flex md:w-80' 
            : 'flex w-full md:w-80'
        } border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 no-overscroll`}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?._id}
            onSelectConversation={handleSelectConversation}
            loading={loading}
            className="w-full"
          />
        </div>

        {/* Chat Area - Full width on mobile when conversation selected */}
        <div className={`${
          selectedConversation 
            ? 'flex w-full md:flex-1' 
            : 'hidden md:flex md:flex-1'
        } flex-col overflow-hidden no-overscroll`}>
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
              hasMoreMessages={hasMoreMessages}
              className="flex-1"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 p-8">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection status indicator - Mobile optimized positioning */}
      {(isReconnecting || connectionError) && (
        <div className={`fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:bottom-4 px-3 py-2 rounded-lg shadow-lg z-50 ${
          connectionError ? 'bg-red-500' : 'bg-yellow-500'
        } text-white safe-area-bottom`}>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm">
              {connectionError ? 'Connection failed' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}