import { useConnectionStore } from '@/lib/stores/connectionStore';

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self';

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
 * Update connection status using modern state management
 * @param currentUserId The ID of the current user
 * @param targetUserId The ID of the target user
 * @param status The new connection status
 * @param connectionId Optional connection ID
 */
export const updateConnectionStatus = (
  currentUserId: string, 
  targetUserId: string, 
  status: ConnectionStatus,
  connectionId?: string
) => {
  const { updateConnectionStatus } = useConnectionStore.getState();
  updateConnectionStatus(currentUserId, targetUserId, status, connectionId);
};

/**
 * Get connection status using modern state management
 * @param currentUserId The ID of the current user
 * @param targetUserId The ID of the target user
 * @returns The connection status
 */
export const getConnectionStatus = (currentUserId: string, targetUserId: string): ConnectionStatus => {
  const { getConnectionStatus } = useConnectionStore.getState();
  return getConnectionStatus(currentUserId, targetUserId);
};

/**
 * Add a user to recent users list
 * @param userId The user ID
 * @param userName The user name
 */
export const addRecentUser = (userId: string, userName: string) => {
  const { addRecentUser } = useConnectionStore.getState();
  addRecentUser(userId, userName);
};

/**
 * Get all recent users
 * @returns Record of userId -> userName
 */
export const getRecentUsers = (): Record<string, string> => {
  const { getRecentUsers } = useConnectionStore.getState();
  return getRecentUsers();
};