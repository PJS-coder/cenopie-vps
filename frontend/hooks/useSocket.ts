import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      console.log('No auth token found for socket connection');
      return;
    }

    console.log('🔑 Connecting to socket with token:', token.substring(0, 20) + '...');

    // Determine the correct socket URL based on environment
    let socketUrl;
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        socketUrl = 'http://localhost:4000';
      } else {
        // Production - use port 4000 explicitly
        socketUrl = 'https://cenopie.com:4000';
      }
    } else {
      socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    }

    console.log('🔌 Connecting to Socket.IO server:', socketUrl);

    const socketInstance = io(socketUrl, {
      auth: { token },
      // Force polling first, then upgrade to websocket
      transports: ['polling', 'websocket'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      // Production-specific options
      upgrade: true,
      rememberUpgrade: false,
      // Add query parameters for debugging
      query: {
        transport: 'polling'
      }
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.log('🔄 Will retry connection...');
      setConnectionStatus('error');
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error.message);
      setConnectionStatus('reconnecting');
    });

    socketInstance.on('connected', (data) => {
      console.log('✅ Socket connection confirmed by server:', data);
    });

    // Debug transport changes
    socketInstance.io.engine.on('upgrade', () => {
      console.log('⬆️ Transport upgraded to:', socketInstance.io.engine.transport.name);
    });

    socketInstance.io.engine.on('upgradeError', (error: any) => {
      console.warn('⚠️ Transport upgrade failed:', error);
    });

    // Test message handler
    socketInstance.on('test_message', (data) => {
      console.log('🧪 Test message received:', data);
    });

    // Production debugging - ping test
    const pingInterval = setInterval(() => {
      if (socketInstance.connected) {
        console.log('🏓 Ping test - Socket still connected');
        socketInstance.emit('ping', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds

    setSocket(socketInstance);

    return () => {
      console.log('🔌 Disconnecting socket...');
      clearInterval(pingInterval);
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected, connectionStatus };
}