import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import logger from '@/lib/logger';

const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectSocket = useCallback(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return;
    
    // Get auth token and user ID from localStorage
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser._id || currentUser.id;

    console.log('🔧 Connection attempt details:', {
      hasToken: !!token,
      hasUserId: !!userId,
      tokenLength: token?.length || 0,
      userIdValue: userId || 'none'
    });

    if (!token || !userId) {
      setConnectionError('User not authenticated');
      console.warn('❌ Cannot connect socket: missing token or userId', { token: !!token, userId: !!userId });
      return;
    }

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Initialize socket connection with cPanel-optimized configuration
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
    console.log('🔌 Connecting to Socket.IO server at:', apiUrl);
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('🔑 Auth token available:', !!token);
    console.log('👤 User ID available:', !!userId);
    console.log('🌐 API URL from env:', process.env.NEXT_PUBLIC_API_URL);

    const socket = io(apiUrl, {
      auth: { token },
      query: { token }, // Add query parameter fallback for token
      transports: ['websocket', 'polling'], // Enable both transports for better reliability
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000, // Increased timeout for initial connection
      forceNew: true,
      // Allow transport upgrades for better performance
      upgrade: true,
      rememberUpgrade: false,
      autoConnect: true,
      // Enable all transports for fallback
      tryAllTransports: true,
      // Additional reliability options
      closeOnBeforeunload: false,
      withCredentials: true,
      // Add extra headers for authentication
      extraHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully (polling mode)');
      setIsConnected(true);
      setConnectionError(null);
      
      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setIsConnected(false);
      
      // Auto-reconnect after a delay if not a manual disconnect
      if (reason !== 'io client disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connectSocket();
        }, 3000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      console.error('❌ Error details:', {
        message: error.message || 'No message',
        description: (error as any).description || 'No description',
        context: (error as any).context || 'No context',
        type: (error as any).type || 'No type',
        stack: error.stack || 'No stack'
      });
      console.error('❌ Connection attempt details:', {
        apiUrl,
        hasToken: !!token,
        userId,
        socketExists: !!socketRef.current
      });
      setIsConnected(false);
      setConnectionError(error.message || 'Connection failed');
      
      // Don't attempt reconnection on auth errors
      if (error.message && error.message.includes('Authentication')) {
        console.log('🚫 Authentication error - stopping reconnection attempts');
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket.IO reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Socket.IO reconnection error:', error);
      setConnectionError('Reconnection failed');
    });

    // Message events
    socket.on('message:received', (data) => {
      console.log('📨 Message received via socket:', data);
      window.dispatchEvent(new CustomEvent('socket:message:received', { detail: data }));
    });

    socket.on('message:sent', (data) => {
      console.log('📤 Message sent confirmation via socket:', data);
      window.dispatchEvent(new CustomEvent('socket:message:sent', { detail: data }));
    });

    socket.on('message:error', (error) => {
      if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
        console.warn('⚠️ Empty message error received from socket - ignoring');
        return;
      }
      
      if (typeof error === 'string' && error.trim() === '') {
        console.warn('⚠️ Empty string error received from socket - ignoring');
        return;
      }
      
      console.error('❌ Message error:', error);
      const errorMessage = typeof error === 'string' ? error : (error.message || error.error || 'Message error');
      setConnectionError(errorMessage);
      
      window.dispatchEvent(new CustomEvent('socket:message:error', { detail: error }));
    });

    // Read receipt events
    socket.on('message:read_receipt', (data) => {
      console.log('📖 Read receipt received:', data);
      window.dispatchEvent(new CustomEvent('socket:message:read_receipt', { detail: data }));
    });

    socket.on('conversation:read_receipt', (data) => {
      console.log('📖 Conversation read receipt received:', data);
      window.dispatchEvent(new CustomEvent('socket:conversation:read_receipt', { detail: data }));
    });

    // Typing events
    socket.on('typing:start', (data) => {
      console.log('⌨️ Typing started:', data);
      setTypingUsers(prev => ({
        ...prev,
        [`${data.conversationId}:${data.userId}`]: data.userName
      }));
      window.dispatchEvent(new CustomEvent('socket:typing:start', { detail: data }));
    });

    socket.on('typing:stop', (data) => {
      console.log('⌨️ Typing stopped:', data);
      setTypingUsers(prev => {
        const newTyping = { ...prev };
        delete newTyping[`${data.conversationId}:${data.userId}`];
        return newTyping;
      });
      window.dispatchEvent(new CustomEvent('socket:typing:stop', { detail: data }));
    });

    // User status events
    socket.on('user:status_update', (data) => {
      console.log('👤 User status update:', data);
      window.dispatchEvent(new CustomEvent('socket:user:status_update', { detail: data }));
    });

    // Message reaction events
    socket.on('message:reaction', (data) => {
      console.log('😀 Message reaction:', data);
      window.dispatchEvent(new CustomEvent('socket:message:reaction', { detail: data }));
    });

    // Notification update events (for count updates only)
    socket.on('notification:update', (data) => {
      window.dispatchEvent(new Event('notificationUpdate'));
    });

    return socket;
  }, []);

  useEffect(() => {
    const socket = connectSocket();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [connectSocket]);

  // Send message via socket
  const sendMessage = useCallback((data: {
    conversationId: string;
    content?: string;
    type?: string;
    replyTo?: string;
    attachments?: any[];
    clientId?: string;
  }) => {
    console.log('📤 Attempting to send message via socket:', {
      conversationId: data.conversationId,
      hasContent: !!data.content,
      hasAttachments: !!(data.attachments && data.attachments.length > 0),
      type: data.type,
      clientId: data.clientId
    });

    if (!data.conversationId || (!data.content && (!data.attachments || data.attachments.length === 0))) {
      console.warn('❌ Cannot send message: missing required data');
      return false;
    }
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      console.warn('❌ Cannot send message: no auth token');
      return false;
    }
    
    if (socketRef.current && socketRef.current.connected) {
      console.log('📤 Sending message via socket:', { ...data, content: data.content?.substring(0, 50) + '...' });
      socketRef.current.emit('message:send', data);
      return true;
    } else {
      console.warn('❌ Cannot send message: socket not connected', {
        hasSocket: !!socketRef.current,
        isConnected: socketRef.current?.connected || false
      });
      return false;
    }
  }, []);

  // Start typing indicator
  const sendTypingStart = useCallback((conversationId: string) => {
    if (!conversationId) return;
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return;
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing:start', { conversationId });
    }
  }, []);

  // Stop typing indicator
  const sendTypingStop = useCallback((conversationId: string) => {
    if (!conversationId) return;
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return;
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing:stop', { conversationId });
    }
  }, []);

  // Mark message as read
  const markMessageAsRead = useCallback((messageId: string, conversationId: string) => {
    if (!messageId || !conversationId) return;
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return;
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message:read', { messageId, conversationId });
    }
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback((conversationId: string) => {
    if (!conversationId) return;
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return;
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('conversation:read', { conversationId });
    }
  }, []);

  // Update user status
  const updateUserStatus = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return;
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('user:status', { status });
    }
  }, []);

  // Force reconnect function
  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting socket...');
    connectSocket();
  }, [connectSocket]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    markMessageAsRead,
    markConversationAsRead,
    updateUserStatus,
    typingUsers,
    forceReconnect,
  };
};

export { useSocket };
export default useSocket;