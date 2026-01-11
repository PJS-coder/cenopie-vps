import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { messageApi, Conversation, Message, SendMessageData } from '@/lib/messageApi';

interface TypingUser {
  userId: string;
  userName: string;
  conversationId: string;
}

interface UserStatus {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
}

export function useMessaging() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const { socket, isConnected, sendMessage: socketSendMessage } = useSocket();
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const messageCache = useRef<Record<string, Message[]>>({});

  // Debug: Log when hook is initialized
  useEffect(() => {
    console.log('🔧 useMessaging hook initialized');
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    // Check if user is authenticated before making API calls
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      console.log('🔧 useMessaging: No auth token, skipping conversation loading');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading conversations...');
      setLoading(true);
      setError(null);
      
      const response = await messageApi.getConversations();
      console.log('📊 Raw conversations response:', response);
      
      const conversationsData = response.data || [];
      
      console.log('📊 Loaded conversations:', conversationsData.length);
      setConversations(conversationsData);
      
      // Initialize unread counts
      const counts: Record<string, number> = {};
      let totalUnread = 0;
      conversationsData.forEach((conv: Conversation) => {
        counts[conv._id] = conv.unreadCount;
        totalUnread += conv.unreadCount;
      });
      setUnreadCounts(counts);
      
      console.log('🔔 Total unread messages:', totalUnread);
      console.log('📈 Unread counts by conversation:', counts);
      
      // Use setTimeout to ensure event is dispatched after render cycle
      setTimeout(() => {
        console.log('📡 Dispatching unreadCountUpdate event with count:', totalUnread);
        window.dispatchEvent(new CustomEvent('unreadCountUpdate', { 
          detail: { count: totalUnread } 
        }));
      }, 0);
      
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      // Don't set error state for network issues, just log them
      // The UI will show loading state until successful
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string, page = 1) => {
    try {
      const response = await messageApi.getMessages(conversationId, { page, limit: 50 });
      const messagesData = response.data.messages || [];
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: page === 1 ? messagesData : [...messagesData, ...(prev[conversationId] || [])]
      }));
      
      // Cache messages
      messageCache.current[conversationId] = messages[conversationId] || [];
      
      return response.data;
    } catch (err) {
      console.error('Failed to load messages:', err);
      throw err;
    }
  }, [messages]);

  // Send a message
  const sendMessage = useCallback(async (data: SendMessageData) => {
    try {
      // Generate client ID for deduplication
      const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const messageData = { ...data, clientId };
      
      // Get current user info
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      // Optimistic update with unique temp ID
      const tempMessage: Message = {
        _id: `temp-${clientId}`,
        conversationId: data.conversationId,
        sender: {
          _id: currentUser._id || currentUser.id || 'current-user',
          name: currentUser.name || 'You',
          profileImage: currentUser.profileImage,
          isVerified: currentUser.isVerified || false
        },
        type: data.type || 'text',
        content: data.content,
        attachments: data.attachments || [],
        status: 'sent',
        reactions: [],
        edited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readBy: [],
        deliveredTo: []
      };
      
      // Add to local state immediately, but check for duplicates
      setMessages(prev => {
        const existingMessages = prev[data.conversationId] || [];
        const messageExists = existingMessages.some(msg => msg._id === tempMessage._id);
        
        if (messageExists) {
          console.log('Temp message already exists, skipping:', tempMessage._id);
          return prev;
        }
        
        return {
          ...prev,
          [data.conversationId]: [...existingMessages, tempMessage]
        };
      });
      
      // Try socket first for real-time delivery
      let socketSent = false;
      if (socket && isConnected) {
        socketSent = socketSendMessage(messageData);
      }
      
      // Always send via API as backup
      try {
        const response = await messageApi.sendMessage(messageData);
        const actualMessage = response.data;
        
        // Replace temp message with actual message
        setMessages(prev => ({
          ...prev,
          [data.conversationId]: prev[data.conversationId]?.map(msg => {
            if (msg._id === tempMessage._id) {
              return actualMessage;
            }
            return msg;
          }) || [actualMessage]
        }));
        
        return actualMessage;
      } catch (apiError) {
        if (!socketSent) {
          // Remove temp message if both socket and API failed
          setMessages(prev => ({
            ...prev,
            [data.conversationId]: prev[data.conversationId]?.filter(msg => msg._id !== tempMessage._id) || []
          }));
          throw apiError;
        }
        // If socket succeeded but API failed, that's okay
      }
      
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    }
  }, [socket, isConnected, socketSendMessage]);

  // Start typing indicator
  const startTyping = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing:start', { conversationId });
      
      // Clear existing timeout
      if (typingTimeouts.current[conversationId]) {
        clearTimeout(typingTimeouts.current[conversationId]);
      }
      
      // Auto-stop typing after 3 seconds
      typingTimeouts.current[conversationId] = setTimeout(() => {
        stopTyping(conversationId);
      }, 3000);
    }
  }, [socket, isConnected]);

  // Stop typing indicator
  const stopTyping = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing:stop', { conversationId });
    }
    
    // Clear timeout
    if (typingTimeouts.current[conversationId]) {
      clearTimeout(typingTimeouts.current[conversationId]);
      delete typingTimeouts.current[conversationId];
    }
  }, [socket, isConnected]);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      if (socket && isConnected) {
        socket.emit('conversation:read', { conversationId });
      }
      
      // Update local unread count
      setUnreadCounts(prev => {
        const newCounts = {
          ...prev,
          [conversationId]: 0
        };
        
        // Calculate total unread count and emit event
        const totalUnread = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('unreadCountUpdate', { 
            detail: { count: totalUnread } 
          }));
        }, 0);
        
        return newCounts;
      });
      
      // Update conversation in list
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
      
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  }, [socket, isConnected]);

  // Get or create direct conversation
  const getOrCreateDirectConversation = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Creating/getting direct conversation with user:', userId);
      const response = await messageApi.getOrCreateDirectConversation(userId);
      console.log('📊 Direct conversation response:', response);
      
      const conversation = response.data.conversation;
      console.log('📊 Conversation data:', conversation);
      
      // Add to conversations if not already present
      setConversations(prev => {
        const exists = prev.some(conv => conv._id === conversation._id);
        if (exists) {
          console.log('📊 Conversation already exists, updating:', conversation._id);
          return prev.map(conv => conv._id === conversation._id ? conversation : conv);
        }
        console.log('📊 Adding new conversation:', conversation._id);
        return [conversation, ...prev];
      });
      
      return conversation;
    } catch (err) {
      console.error('Failed to get/create conversation:', err);
      throw err;
    }
  }, []);

  // Search messages
  const searchMessages = useCallback(async (query: string, conversationId?: string) => {
    try {
      const response = await messageApi.searchMessages({
        q: query,
        conversationId,
        limit: 20
      });
      return response.data;
    } catch (err) {
      console.error('Failed to search messages:', err);
      throw err;
    }
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle new messages
    const handleNewMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const message: Message = customEvent.detail;
      
      // Check if message already exists to prevent duplicates
      setMessages(prev => {
        const existingMessages = prev[message.conversationId] || [];
        const messageExists = existingMessages.some(msg => msg._id === message._id);
        
        if (messageExists) {
          console.log('Message already exists, skipping:', message._id);
          return prev;
        }
        
        return {
          ...prev,
          [message.conversationId]: [...existingMessages, message]
        };
      });
      
      // Update conversation last message and unread count
      setConversations(prev => 
        prev.map(conv => {
          if (conv._id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              lastActivity: message.createdAt,
              unreadCount: conv.unreadCount + 1
            };
          }
          return conv;
        })
      );
      
      // Update unread count
      setUnreadCounts(prev => {
        const newCounts = {
          ...prev,
          [message.conversationId]: (prev[message.conversationId] || 0) + 1
        };
        
        // Calculate total unread count and emit event
        const totalUnread = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('unreadCountUpdate', { 
            detail: { count: totalUnread } 
          }));
        }, 0);
        
        return newCounts;
      });
    };

    // Handle message sent confirmation
    const handleMessageSent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message, clientId } = customEvent.detail;
      
      // Replace temp message with actual message using clientId
      setMessages(prev => ({
        ...prev,
        [message.conversationId]: prev[message.conversationId]?.map(msg => {
          // Match by clientId if available, or by temp ID pattern
          if (clientId && msg._id.startsWith('temp-') && msg._id.includes(clientId.split('-')[1])) {
            return message;
          }
          // Fallback: if message IDs match exactly (shouldn't happen but just in case)
          if (msg._id === message._id && msg._id.startsWith('temp-')) {
            return message;
          }
          return msg;
        }) || [message]
      }));
    };

    // Handle typing indicators
    const handleTypingStart = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      setTypingUsers(prev => {
        const filtered = prev.filter(user => 
          !(user.conversationId === data.conversationId && user.userId === data.userId)
        );
        return [...filtered, data];
      });
    };

    const handleTypingStop = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      setTypingUsers(prev => 
        prev.filter(user => 
          !(user.conversationId === data.conversationId && user.userId === data.userId)
        )
      );
    };

    // Handle user status updates
    const handleUserStatusUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data: UserStatus = customEvent.detail;
      setUserStatuses(prev => ({
        ...prev,
        [data.userId]: data
      }));
    };

    // Handle read receipts
    const handleReadReceipt = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      // Update message read status in all conversations
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(conversationId => {
          updated[conversationId] = updated[conversationId].map(msg => {
            if (msg._id === data.messageId) {
              return {
                ...msg,
                readBy: [...msg.readBy, { user: data.readBy._id, readAt: data.readAt }]
              };
            }
            return msg;
          });
        });
        return updated;
      });
    };

    // Handle message reactions
    const handleMessageReaction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(conversationId => {
          updated[conversationId] = updated[conversationId].map(msg => {
            if (msg._id === data.messageId) {
              let reactions = [...msg.reactions];
              
              if (data.action === 'add' && data.emoji) {
                // Remove existing reaction from this user
                reactions = reactions.filter(r => r.user !== data.userId);
                // Add new reaction
                reactions.push({
                  user: data.userId,
                  emoji: data.emoji,
                  createdAt: new Date().toISOString()
                });
              } else if (data.action === 'remove') {
                reactions = reactions.filter(r => r.user !== data.userId);
              }
              
              return { ...msg, reactions };
            }
            return msg;
          });
        });
        return updated;
      });
    };

    // Register event listeners
    window.addEventListener('socket:message:received', handleNewMessage);
    window.addEventListener('socket:message:sent', handleMessageSent);
    window.addEventListener('socket:typing:start', handleTypingStart);
    window.addEventListener('socket:typing:stop', handleTypingStop);
    window.addEventListener('socket:user:status_update', handleUserStatusUpdate);
    window.addEventListener('socket:message:read_receipt', handleReadReceipt);
    window.addEventListener('socket:message:reaction', handleMessageReaction);

    // Cleanup
    return () => {
      window.removeEventListener('socket:message:received', handleNewMessage);
      window.removeEventListener('socket:message:sent', handleMessageSent);
      window.removeEventListener('socket:typing:start', handleTypingStart);
      window.removeEventListener('socket:typing:stop', handleTypingStop);
      window.removeEventListener('socket:user:status_update', handleUserStatusUpdate);
      window.removeEventListener('socket:message:read_receipt', handleReadReceipt);
      window.removeEventListener('socket:message:reaction', handleMessageReaction);
    };
  }, [socket]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Debug: Log unread counts when they change
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    console.log('🔔 Total unread messages:', totalUnread);
    console.log('📊 Unread counts by conversation:', unreadCounts);
  }, [unreadCounts]);

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    // State
    conversations,
    messages,
    loading,
    error,
    typingUsers,
    userStatuses,
    unreadCounts,
    isConnected,
    
    // Actions
    loadConversations,
    loadMessages,
    sendMessage,
    startTyping,
    stopTyping,
    markConversationAsRead,
    getOrCreateDirectConversation,
    searchMessages,
    
    // Utilities
    getTotalUnreadCount: () => Object.values(unreadCounts).reduce((sum, count) => sum + count, 0),
    getConversationMessages: (conversationId: string) => messages[conversationId] || [],
    getTypingUsersForConversation: (conversationId: string) => 
      typingUsers.filter(user => user.conversationId === conversationId),
    getUserStatus: (userId: string) => userStatuses[userId]?.status || 'offline'
  };
}