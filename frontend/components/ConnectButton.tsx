"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlusIcon, CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { connectionApi } from '@/lib/api';
import useSocket from '@/hooks/useSocket';
import { useConnectionSync } from '@/hooks/useConnectionSync';
import { useToastContext } from '@/components/ToastProvider';
import ConfirmModal from '@/components/ConfirmModal';

interface ConnectButtonProps {
  userId: string;
  userName: string;
  currentUserId: string;
  initialStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self';
  initialConnectionId?: string | null;
  onStatusChange?: (status: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ConnectButton({
  userId,
  userName,
  currentUserId,
  initialStatus = 'none',
  initialConnectionId = null,
  onStatusChange,
  size = 'sm',
  className = ''
}: ConnectButtonProps) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(initialConnectionId);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const { socket } = useSocket();
  const { getConnectionStatus, updateConnectionStatus } = useConnectionSync(currentUserId);
  const toast = useToastContext();

  // Use initial status with connection sync system
  useEffect(() => {
    if (userId === currentUserId) {
      setStatus('self');
      return;
    }

    // Check global connection status first
    const globalStatus = getConnectionStatus(userId);
    
    if (globalStatus !== 'none') {
      // Use global status if available
      console.log(`🔄 Using global connection status "${globalStatus}" for user ${userId}`);
      setStatus(globalStatus);
    } else {
      // Use provided status directly - no API call needed
      setStatus(initialStatus);
      updateConnectionStatus(userId, initialStatus);
      console.log(`✅ Using provided status "${initialStatus}" for user ${userId}`);
    }
  }, [userId, currentUserId, initialStatus]);

  // Socket.IO listeners for real-time connection updates
  useEffect(() => {
    if (!socket) return;

    const handleConnectionUpdate = (data: { 
      userId: string; 
      targetUserId: string; 
      status: string;
      connectionId?: string;
    }) => {
      // Update status if this update is relevant to current user pair
      if ((data.userId === currentUserId && data.targetUserId === userId) ||
          (data.userId === userId && data.targetUserId === currentUserId)) {
        
        setStatus(data.status as typeof status);
        
        if (data.connectionId) {
          setConnectionId(data.connectionId);
        }
        
        onStatusChange?.(data.status);
      }
    };

    // Listen for various connection events
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
  }, [socket, userId, currentUserId, onStatusChange]);

  const handleConnect = async () => {
    // Prevent double-clicks
    if (loading) return;
    
    // Instant UI update - no loading state needed
    setStatus('pending_sent');
    updateConnectionStatus(userId, 'pending_sent');
    onStatusChange?.('pending_sent');
    
    // Fire and forget API call - don't block UI
    connectionApi.sendRequest(userId)
      .then((response) => {
        console.log('Connection request sent successfully');
        setConnectionId(response.data._id);
        
        // Emit socket event for real-time updates to other users
        if (socket) {
          socket.emit('connection:request_sent', {
            userId: currentUserId,
            targetUserId: userId,
            status: 'pending_sent',
            connectionId: response.data._id
          });
        }
      })
      .catch((error) => {
        console.error('Error sending connection request:', error);
        
        // Revert optimistic update on error
        setStatus('none');
        updateConnectionStatus(userId, 'none');
        onStatusChange?.('none');
        
        // Show error without blocking UI
        setTimeout(() => {
          toast.error('Failed to send connection request. Please try again.');
        }, 100);
      });
  };

  const handleAccept = async () => {
    if (!connectionId || loading) return;
    
    // Instant UI update - show accepted state immediately
    const previousStatus = status;
    setStatus('accepted');
    updateConnectionStatus(userId, 'accepted');
    onStatusChange?.('accepted');
    
    // Fire and forget API call
    connectionApi.acceptRequest(connectionId)
      .then(() => {
        console.log('Connection accepted successfully');
        
        // Emit socket event for real-time updates to other users
        if (socket) {
          socket.emit('connection:accepted', {
            userId: currentUserId,
            targetUserId: userId,
            status: 'accepted',
            connectionId: connectionId
          });
        }
      })
      .catch((error) => {
        console.error('Error accepting connection request:', error);
        
        // Revert optimistic update on error
        setStatus(previousStatus);
        updateConnectionStatus(userId, previousStatus);
        onStatusChange?.(previousStatus);
        
        setTimeout(() => {
          toast.error('Failed to accept connection request. Please try again.');
        }, 100);
      });
  };

  const handleDecline = async () => {
    if (!connectionId || loading) return;
    
    // Instant UI update - hide button immediately
    const previousStatus = status;
    const previousConnectionId = connectionId;
    setStatus('none');
    setConnectionId(null);
    updateConnectionStatus(userId, 'none');
    onStatusChange?.('none');
    
    // Fire and forget API call
    connectionApi.declineRequest(previousConnectionId)
      .then(() => {
        console.log('Connection declined successfully');
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('connection:declined', {
            userId: currentUserId,
            targetUserId: userId,
            status: 'none'
          });
        }
      })
      .catch((error) => {
        console.error('Error declining connection request:', error);
        
        // Revert optimistic update on error
        setStatus(previousStatus);
        setConnectionId(previousConnectionId);
        updateConnectionStatus(userId, previousStatus);
        onStatusChange?.(previousStatus);
        
        setTimeout(() => {
          toast.error('Failed to decline connection request. Please try again.');
        }, 100);
      });
  };

  const handleCancel = async () => {
    if (!connectionId || loading) return;
    
    // Instant UI update - revert to connect button immediately
    const previousStatus = status;
    const previousConnectionId = connectionId;
    setStatus('none');
    setConnectionId(null);
    updateConnectionStatus(userId, 'none');
    onStatusChange?.('none');
    
    // Fire and forget API call
    connectionApi.cancelRequest(previousConnectionId)
      .then(() => {
        console.log('Connection cancelled successfully');
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('connection:cancelled', {
            userId: currentUserId,
            targetUserId: userId,
            status: 'none'
          });
        }
      })
      .catch((error) => {
        console.error('Error cancelling connection request:', error);
        
        // Revert optimistic update on error
        setStatus(previousStatus);
        setConnectionId(previousConnectionId);
        updateConnectionStatus(userId, previousStatus);
        onStatusChange?.(previousStatus);
        
        setTimeout(() => {
          toast.error('Failed to cancel connection request. Please try again.');
        }, 100);
      });
  };

  const handleRemove = async () => {
    if (!connectionId || loading) return;
    
    setShowRemoveConfirm(true);
  };

  const confirmRemove = async () => {
    if (!connectionId) return;
    
    // Instant UI update - show connect button immediately after confirmation
    const previousStatus = status;
    const previousConnectionId = connectionId;
    setStatus('none');
    setConnectionId(null);
    updateConnectionStatus(userId, 'none');
    onStatusChange?.('none');
    
    // Fire and forget API call
    connectionApi.removeConnection(previousConnectionId)
      .then(() => {
        console.log('Connection removed successfully');
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('connection:removed', {
            userId: currentUserId,
            targetUserId: userId,
            status: 'none'
          });
        }
      })
      .catch((error) => {
        console.error('Error removing connection:', error);
        
        // Revert optimistic update on error
        setStatus(previousStatus);
        setConnectionId(previousConnectionId);
        updateConnectionStatus(userId, previousStatus);
        onStatusChange?.(previousStatus);
        
        setTimeout(() => {
          toast.error('Failed to remove connection. Please try again.');
        }, 100);
      });
  };

  // Don't show button for self
  if (status === 'self') {
    return null;
  }

  // Icon-only size classes for all screen sizes
  const iconOnlySizeClasses = {
    sm: 'w-9 h-9 p-2 rounded-full',
    md: 'w-10 h-10 p-2.5 rounded-full',
    lg: 'w-11 h-11 p-3 rounded-full'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const renderButton = () => {
    // Render different button states - icon only for all screen sizes
    switch (status) {
    case 'none':
      return (
        <Button
          onClick={handleConnect}
          className={`${className} ${iconOnlySizeClasses[size]} border border-gray-300 text-gray-700 hover:bg-[#0BC0DF] hover:text-white flex items-center justify-center`}
          title="Connect"
        >
          <UserPlusIcon className={iconSizes[size]} />
        </Button>
      );

    case 'pending_sent':
      return (
        <Button
          onClick={handleCancel}
          variant="outline"
          className={`${className} ${iconOnlySizeClasses[size]} border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center`}
          title="Pending"
        >
          <ClockIcon className={iconSizes[size]} />
        </Button>
      );

    case 'pending_received':
      return (
        <div className="flex gap-1 sm:gap-2">
          <Button
            onClick={handleAccept}
            className={`${iconOnlySizeClasses[size]} bg-green-600 hover:bg-green-700 text-white border-0 flex items-center justify-center`}
            title="Accept"
          >
            <CheckIcon className={iconSizes[size]} />
          </Button>
          <Button
            onClick={handleDecline}
            variant="outline"
            className={`${iconOnlySizeClasses[size]} border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center`}
            title="Ignore"
          >
            <XMarkIcon className={iconSizes[size]} />
          </Button>
        </div>
      );

    case 'accepted':
      return (
        <div
          className={`${iconOnlySizeClasses[size]} flex items-center justify-center bg-[#0CC0DF]/10`}
          title="Connected"
        >
          <svg 
            className={iconSizes[size] + " text-[#0CC0DF]"} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
      );

    default:
      return null;
    }
  };

  return (
    <>
      {renderButton()}
      
      <ConfirmModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={confirmRemove}
        title="Remove Connection"
        message={`Are you sure you want to remove ${userName} from your connections?`}
        confirmText="Remove"
        type="warning"
      />
    </>
  );
}
