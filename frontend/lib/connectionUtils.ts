// Utility functions for handling connection status updates

/**
 * Dispatch a custom event to notify other components about connection status updates
 * @param userId The ID of the user whose connection status has changed
 */
export const notifyConnectionStatusUpdate = (userId: string) => {
  const event = new CustomEvent('connectionStatusUpdate', {
    detail: { userId }
  });
  window.dispatchEvent(event);
};

/**
 * Update connection status in localStorage and notify other components
 * @param currentUserId The ID of the current user
 * @param targetUserId The ID of the target user
 * @param status The new connection status
 */
export const updateConnectionStatus = (currentUserId: string, targetUserId: string, status: 'none' | 'pending' | 'connected') => {
  // Update localStorage
  localStorage.setItem(`connectionStatus_${currentUserId}_${targetUserId}`, status);
  
  // Notify other components
  notifyConnectionStatusUpdate(targetUserId);
};

/**
 * Get connection status from localStorage
 * @param currentUserId The ID of the current user
 * @param targetUserId The ID of the target user
 * @returns The connection status
 */
export const getConnectionStatus = (currentUserId: string, targetUserId: string): 'none' | 'pending' | 'connected' => {
  const storedStatus = localStorage.getItem(`connectionStatus_${currentUserId}_${targetUserId}`);
  if (storedStatus === 'pending' || storedStatus === 'connected') {
    return storedStatus;
  }
  return 'none';
};