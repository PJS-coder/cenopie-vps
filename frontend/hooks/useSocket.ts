import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
// Removed unused logger import

const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectSocket = useCallback(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return;
    
    // Get auth token and user ID from localStorage
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser._id || currentUser.id;

    // Validate token format before attempting connection
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      setConnectionError('No valid authentication token found');
      return;
    }

    if (!userId) {
      setConnectionError('User not authenticated');
      return;
    }

    // Basic JWT format validation (should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      setConnectionError('Invalid token format');
      // Clear invalid token
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      return;
    }

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Initialize socket connection with environment-specific configuration
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

    const socket = io(socketUrl, {
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
      setIsConnected(true);
      setHasConnectedOnce(true);
      setConnectionError(null);
      
      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('disconnect', (reason) => {
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
      // Handle authentication errors specifically
      if (error.message?.includes('Authentication error') || 
          error.message?.includes('Invalid token') ||
          error.message?.includes('jwt') ||
          error.message?.includes('Token expired')) {
        // Clear invalid tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        setConnectionError('Authentication failed - please log in again');
        
        // Disconnect socket to prevent reconnection attempts
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        return;
      }
      
      setIsConnected(false);
      setConnectionError(error.message || 'Connection failed');
    });

    socket.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Socket.IO reconnection error:', error);
      setConnectionError('Reconnection failed');
    });

    // Message events
    socket.on('message:received', (data) => {
      window.dispatchEvent(new CustomEvent('socket:message:received', { detail: data }));
    });

    socket.on('message:sent', (data) => {
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
      
      // If there's a clientId, mark the corresponding temp message as failed
      if (error.clientId) {
        window.dispatchEvent(new CustomEvent('socket:message:failed', { 
          detail: { clientId: error.clientId, error: errorMessage } 
        }));
      }
      
      window.dispatchEvent(new CustomEvent('socket:message:error', { detail: error }));
    });

    // Read receipt events
    socket.on('message:read_receipt', (data) => {
      window.dispatchEvent(new CustomEvent('socket:message:read_receipt', { detail: data }));
    });

    socket.on('conversation:read_receipt', (data) => {
      window.dispatchEvent(new CustomEvent('socket:conversation:read_receipt', { detail: data }));
    });

    // Typing events
    socket.on('typing:start', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [`${data.conversationId}:${data.userId}`]: data.userName
      }));
      window.dispatchEvent(new CustomEvent('socket:typing:start', { detail: data }));
    });

    socket.on('typing:stop', (data) => {
      setTypingUsers(prev => {
        const newTyping = { ...prev };
        delete newTyping[`${data.conversationId}:${data.userId}`];
        return newTyping;
      });
      window.dispatchEvent(new CustomEvent('socket:typing:stop', { detail: data }));
    });

    // User status events
    socket.on('user:status_update', (data) => {
      window.dispatchEvent(new CustomEvent('socket:user:status_update', { detail: data }));
    });

    // Message reaction events
    socket.on('message:reaction', (data) => {
      window.dispatchEvent(new CustomEvent('socket:message:reaction', { detail: data }));
    });

    // Notification update events (for count updates only)
    socket.on('notification:update', (data) => {
      window.dispatchEvent(new Event('notificationUpdate'));
    });

    return socket;
  }, []);

  useEffect(() => {
    // Only connect if we have a valid token
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser._id || currentUser.id;
    
    if (token && userId) {
      // Small delay to prevent flash of reconnecting state
      const connectTimeout = setTimeout(() => {
        const socket = connectSocket();
      }, 100);

      // Cleanup
      return () => {
        clearTimeout(connectTimeout);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (socketRef.current) {
          socketRef.current.close();
        }
      };
    } else {
      // No valid credentials, don't attempt connection
      // Only set error if we're not already authenticated
      if (!hasConnectedOnce) {
        setConnectionError('Authentication required');
      }
    }
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
      return false;
    }
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      return false;
    }
    
    if (socketRef.current && socketRef.current.connected) {
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
    connectSocket();
  }, [connectSocket]);

  // Clear tokens and reset connection
  const clearTokensAndReconnect = useCallback(() => {
    console.log('🧹 Clearing tokens and resetting connection...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setConnectionError(null);
    setIsConnected(false);
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

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
    clearTokensAndReconnect,
    hasConnectedOnce,
    isReconnecting: hasConnectedOnce && !isConnected,
  };
};

export { useSocket };
export default useSocket;