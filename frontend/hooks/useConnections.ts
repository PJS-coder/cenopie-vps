"use client";

import { useState, useEffect, useCallback } from 'react';
import { connectionApi } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';

interface Connection {
  connectionId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    headline?: string;
    isVerified?: boolean;
  };
  connectedAt: string;
  mutualConnections: number;
}

interface ConnectionRequest {
  connectionId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    headline?: string;
    isVerified?: boolean;
  };
  message: string;
  requestedAt: string;
  type: 'received' | 'sent';
}

export const useConnections = (userId?: string) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await connectionApi.getUserConnections(userId);
      setConnections((response.connections as Connection[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Listen for real-time connection updates
  useEffect(() => {
    if (!socket) return;

    const handleConnectionUpdate = () => {
      // Refetch connections when there's an update
      fetchConnections();
    };

    socket.on('connection:accepted', handleConnectionUpdate);
    socket.on('connection:status_update', handleConnectionUpdate);

    return () => {
      socket.off('connection:accepted', handleConnectionUpdate);
      socket.off('connection:status_update', handleConnectionUpdate);
    };
  }, [socket, fetchConnections]);

  return {
    connections,
    loading,
    error,
    refetch: fetchConnections
  };
};

export const useConnectionRequests = (type: 'received' | 'sent' = 'received') => {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { isAuthenticated } = useAuth();

  const fetchRequests = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping connection requests fetch');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching connection requests...');
      const response = await connectionApi.getConnectionRequests(type);
      console.log('Connection requests response:', response);
      setRequests((response.requests as ConnectionRequest[]) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch connection requests';
      console.error('Error fetching connection requests:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [type, isAuthenticated]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Listen for real-time connection request updates
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (data: any) => {
      if (type === 'received') {
        // Add new request to the list
        const newRequest: ConnectionRequest = {
          connectionId: data.connectionId,
          user: data.requester,
          message: data.message,
          requestedAt: data.createdAt,
          type: 'received'
        };
        setRequests(prev => [newRequest, ...prev]);
      }
    };

    const handleRequestUpdate = () => {
      // Refetch requests when there's an update
      fetchRequests();
    };

    socket.on('connection:request', handleNewRequest);
    socket.on('connection:accepted', handleRequestUpdate);
    socket.on('connection:status_update', handleRequestUpdate);

    return () => {
      socket.off('connection:request', handleNewRequest);
      socket.off('connection:accepted', handleRequestUpdate);
      socket.off('connection:status_update', handleRequestUpdate);
    };
  }, [socket, type, fetchRequests]);

  const acceptRequest = async (connectionId: string) => {
    try {
      await connectionApi.acceptRequest(connectionId);
      // Remove from requests list
      setRequests(prev => prev.filter(req => req.connectionId !== connectionId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to accept request');
    }
  };

  const declineRequest = async (connectionId: string) => {
    try {
      await connectionApi.declineRequest(connectionId);
      // Remove from requests list
      setRequests(prev => prev.filter(req => req.connectionId !== connectionId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to decline request');
    }
  };

  const cancelRequest = async (connectionId: string) => {
    try {
      await connectionApi.cancelRequest(connectionId);
      // Remove from requests list
      setRequests(prev => prev.filter(req => req.connectionId !== connectionId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to cancel request');
    }
  };

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    acceptRequest,
    declineRequest,
    cancelRequest
  };
};

export const useConnectionStatus = (userId: string, currentUserId: string) => {
  const [status, setStatus] = useState<string>('not_connected');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { isAuthenticated } = useAuth();

  const checkStatus = useCallback(async () => {
    if (!isAuthenticated || !userId || !currentUserId) {
      console.log('Not authenticated or missing user IDs, skipping connection status check');
      setStatus('not_connected');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Checking connection status for user:', userId);
      const response = await connectionApi.getConnectionStatus(userId);
      console.log('Connection status response:', response);
      setStatus((response as any)?.status || 'not_connected');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check connection status';
      console.error('Error checking connection status:', errorMessage, err);
      setError(errorMessage);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userId, currentUserId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Listen for real-time status updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: { userId: string; status: string }) => {
      if (data.userId === userId) {
        setStatus(data.status);
      }
    };

    const handleConnectionRequest = (data: any) => {
      if (data.requester._id === userId) {
        setStatus('pending_received');
      }
    };

    const handleConnectionAccepted = (data: any) => {
      if (data.accepter._id === userId) {
        setStatus('accepted');
      }
    };

    socket.on('connection:status_update', handleStatusUpdate);
    socket.on('connection:request', handleConnectionRequest);
    socket.on('connection:accepted', handleConnectionAccepted);

    return () => {
      socket.off('connection:status_update', handleStatusUpdate);
      socket.off('connection:request', handleConnectionRequest);
      socket.off('connection:accepted', handleConnectionAccepted);
    };
  }, [socket, userId]);

  return {
    status,
    loading,
    error,
    refetch: checkStatus
  };
};
