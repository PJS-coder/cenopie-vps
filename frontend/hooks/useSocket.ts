import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      console.log('No auth token found for socket connection');
      return;
    }

    console.log('Connecting to socket with token:', token.substring(0, 20) + '...');

    // Determine the correct socket URL based on environment
    let socketUrl;
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        socketUrl = 'http://localhost:4000';
      } else {
        // Production - use the same domain without port
        socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}`;
      }
    } else {
      socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    }

    console.log('🔌 Connecting to Socket.IO server:', socketUrl);

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully to:', socketUrl);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.log('🔄 Will retry connection...');
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error.message);
    });

    socketInstance.on('connected', (data) => {
      console.log('✅ Socket connection confirmed:', data);
    });

    socketInstance.on('test_message', (data) => {
      console.log('🧪 Test message received:', data);
    });

    setSocket(socketInstance);

    return () => {
      console.log('🔌 Disconnecting socket...');
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
}