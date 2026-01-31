import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Determine the correct socket URL based on environment
    let socketUrl;
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        socketUrl = 'http://localhost:4000';
      } else {
        // Production - try multiple possible URLs
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        // First try the API URL from environment or default backend port
        if (process.env.NEXT_PUBLIC_API_URL) {
          socketUrl = process.env.NEXT_PUBLIC_API_URL;
        } else {
          // Fallback to same domain with port 4000
          socketUrl = `${protocol}//${hostname}:4000`;
        }
      }
    } else {
      socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    }

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      upgrade: true,
      rememberUpgrade: true
    });

    socketInstance.on('connect', () => {
      setSocket(socketInstance);
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setSocket(null);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setConnectionStatus('error');
      setSocket(null);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      setSocket(socketInstance);
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketInstance.on('reconnect_error', (error) => {
      setConnectionStatus('reconnecting');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected, connectionStatus };
}