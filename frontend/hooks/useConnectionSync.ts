import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface ConnectionStatus {
  [userId: string]: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
}

// Global connection status store
let globalConnectionStatus: ConnectionStatus = {};
const listeners: Array<(status: ConnectionStatus) => void> = [];

export function useConnectionSync(currentUserId: string) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(globalConnectionStatus);
  const { socket } = useSocket();

  // Subscribe to global status changes
  useEffect(() => {
    const listener = (newStatus: ConnectionStatus) => {
      setConnectionStatus({ ...newStatus });
    };
    
    listeners.push(listener);
    
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  // Socket listeners for connection updates
  useEffect(() => {
    if (!socket) return;

    const handleConnectionUpdate = (data: { 
      userId: string; 
      targetUserId: string; 
      status: string;
    }) => {
      // Update global status for both directions
      const newStatus = { ...globalConnectionStatus };
      
      // If current user is involved in this connection
      if (data.userId === currentUserId) {
        newStatus[data.targetUserId] = data.status as any;
      } else if (data.targetUserId === currentUserId) {
        // Handle reverse connection status
        if (data.status === 'pending_sent') {
          newStatus[data.userId] = 'pending_received';
        } else if (data.status === 'pending_received') {
          newStatus[data.userId] = 'pending_sent';
        } else {
          newStatus[data.userId] = data.status as any;
        }
      }
      
      globalConnectionStatus = newStatus;
      
      // Notify all listeners
      listeners.forEach(listener => listener(newStatus));
      
      console.log(`🔄 Connection status updated globally:`, newStatus);
    };

    // Listen for all connection events
    socket.on('connection:status_update', handleConnectionUpdate);
    socket.on('connection:accepted', handleConnectionUpdate);
    socket.on('connection:declined', handleConnectionUpdate);
    socket.on('connection:cancelled', handleConnectionUpdate);
    socket.on('connection:removed', handleConnectionUpdate);
    socket.on('connection:request_sent', handleConnectionUpdate);

    return () => {
      socket.off('connection:status_update', handleConnectionUpdate);
      socket.off('connection:accepted', handleConnectionUpdate);
      socket.off('connection:declined', handleConnectionUpdate);
      socket.off('connection:cancelled', handleConnectionUpdate);
      socket.off('connection:removed', handleConnectionUpdate);
      socket.off('connection:request_sent', handleConnectionUpdate);
    };
  }, [socket, currentUserId]);

  // Function to update connection status
  const updateConnectionStatus = (userId: string, status: string) => {
    const newStatus = { ...globalConnectionStatus };
    newStatus[userId] = status as any;
    globalConnectionStatus = newStatus;
    
    // Notify all listeners
    listeners.forEach(listener => listener(newStatus));
  };

  // Function to get connection status for a specific user
  const getConnectionStatus = (userId: string) => {
    return globalConnectionStatus[userId] || 'none';
  };

  return {
    connectionStatus,
    updateConnectionStatus,
    getConnectionStatus
  };
}
