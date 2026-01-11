import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

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

    if (!token || !userId) {
      setConnectionError('User not authenticated');
      return;
    }

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    console.log('🔌 Connecting to Socket.IO server...');

    // Initialize socket connection with better configuration
    const socket = io('https://api.cenopie.com', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully');
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
        }, 2000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      setIsConnected(false);
      setConnectionError(error.message || 'Connection failed');
      
      // Don't emit message:error for connection errors
      if ((error as any).type !== 'TransportError') {
        console.log('🔄 Will attempt to reconnect...');
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

    // New message events
    socket.on('message:received', (data) => {
      console.log('📨 Message received via socket:', data);
      // Dispatch custom event for message components to listen to
      window.dispatchEvent(new CustomEvent('socket:message:received', { detail: data }));
    });

    socket.on('message:sent', (data) => {
      console.log('📤 Message sent confirmation via socket:', data);
      // Dispatch custom event for message components to listen to
      window.dispatchEvent(new CustomEvent('socket:message:sent', { detail: data }));
    });

    socket.on('message:error', (error) => {
      // Handle empty error objects or null/undefined errors
      if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
        console.warn('⚠️ Empty message error received from socket - ignoring');
        return; // Don't process empty errors
      }
      
      console.error('❌ Message error:', error);
      setConnectionError(error.message || error.error || 'Message error');
      
      // Dispatch custom event for error handling
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
      console.warn('❌ Cannot send message: socket not connected');
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