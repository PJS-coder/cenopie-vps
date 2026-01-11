"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface MessageContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  resetUnreadCount: () => void;
  incrementUnreadCount: () => void;
  updateUnreadCount: (count: number) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for unread count updates from the messaging system
  useEffect(() => {
    const handleUnreadCountUpdate = (event: CustomEvent) => {
      const { count } = event.detail;
      console.log('📱 MessageContext received unread count update:', count);
      setUnreadCount(count);
    };

    console.log('📱 MessageContext: Setting up event listener for unreadCountUpdate');
    window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate as EventListener);
    
    return () => {
      console.log('📱 MessageContext: Cleaning up event listener');
      window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate as EventListener);
    };
  }, []); // Remove unreadCount dependency to prevent infinite re-renders

  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  const incrementUnreadCount = () => {
    // Only increment if the user is not currently viewing the messages page
    if (pathname !== '/messages') {
      setUnreadCount(prev => prev + 1);
    }
  };

  const updateUnreadCount = (count: number) => {
    setUnreadCount(count);
  };

  return (
    <MessageContext.Provider value={{ 
      unreadCount, 
      setUnreadCount, 
      resetUnreadCount, 
      incrementUnreadCount,
      updateUnreadCount 
    }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    // Return default values instead of throwing error
    return {
      unreadCount: 0,
      setUnreadCount: () => {},
      resetUnreadCount: () => {},
      incrementUnreadCount: () => {}
    };
  }
  return context;
};