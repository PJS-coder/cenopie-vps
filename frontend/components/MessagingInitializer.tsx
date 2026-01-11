'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/hooks/useMessaging';

/**
 * Global messaging initializer component
 * This component initializes the messaging system globally so that
 * unread message counts are available throughout the app, not just on the messages page
 */
export default function MessagingInitializer() {
  const { isAuthenticated } = useAuth();
  
  // Always call the hook, but let it handle authentication internally
  const messaging = useMessaging();

  useEffect(() => {
    if (isAuthenticated && messaging && !messaging.loading) {
      console.log('🔄 Messaging system initialized globally');
      console.log('📊 Conversations loaded:', messaging.conversations.length);
      console.log('🔔 Total unread count:', messaging.getTotalUnreadCount());
      console.log('📈 Unread counts by conversation:', messaging.unreadCounts);
    }
  }, [
    isAuthenticated, 
    messaging?.loading, 
    messaging?.conversations?.length, 
  ]);

  // Separate effect for dispatching unread count updates to avoid setState during render
  useEffect(() => {
    if (isAuthenticated && messaging && !messaging.loading && messaging.conversations && messaging.conversations.length >= 0) {
      // Use setTimeout to ensure this runs after the current render cycle
      const timeoutId = setTimeout(() => {
        const totalUnread = messaging.getTotalUnreadCount();
        console.log('📡 Dispatching unread count update:', totalUnread);
        window.dispatchEvent(new CustomEvent('unreadCountUpdate', { 
          detail: { count: totalUnread } 
        }));
      }, 100); // Slightly longer delay to ensure render is complete

      return () => clearTimeout(timeoutId);
    }
  }, [
    isAuthenticated, 
    messaging?.loading, 
    messaging?.conversations?.length
  ]);

  // This component doesn't render anything, it just initializes the messaging system
  return null;
}