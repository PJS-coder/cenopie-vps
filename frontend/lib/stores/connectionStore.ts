import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self';

interface Connection {
  id: string;
  userId: string;
  targetUserId: string;
  status: ConnectionStatus;
  connectionId?: string;
  updatedAt: number;
}

interface ConnectionState {
  connections: Record<string, Connection>;
  recentUsers: Record<string, string>; // userId -> userName
}

interface ConnectionActions {
  updateConnectionStatus: (
    currentUserId: string,
    targetUserId: string,
    status: ConnectionStatus,
    connectionId?: string
  ) => void;
  getConnectionStatus: (currentUserId: string, targetUserId: string) => ConnectionStatus;
  addRecentUser: (userId: string, userName: string) => void;
  getRecentUsers: () => Record<string, string>;
  clearExpiredConnections: () => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

// Safe storage wrapper for SSR
const createSafeStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  
  return {
    getItem: (name: string) => {
      try {
        return localStorage.getItem(name);
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value);
      } catch (error) {
        console.warn('Failed to write to localStorage:', error);
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    },
  };
};

const CONNECTION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      connections: {},
      recentUsers: {},

      // Actions
      updateConnectionStatus: (currentUserId, targetUserId, status, connectionId) => {
        set((state) => {
          const key = `${currentUserId}_${targetUserId}`;
          state.connections[key] = {
            id: key,
            userId: currentUserId,
            targetUserId,
            status,
            connectionId,
            updatedAt: Date.now(),
          };
        });

        // Dispatch custom event for real-time updates across components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('connectionStatusUpdate', {
            detail: { currentUserId, targetUserId, status, connectionId }
          }));
        }
      },

      getConnectionStatus: (currentUserId, targetUserId) => {
        const { connections } = get();
        const key = `${currentUserId}_${targetUserId}`;
        const connection = connections[key];
        
        if (!connection) return 'none';
        
        // Check if connection data is expired
        if (Date.now() - connection.updatedAt > CONNECTION_EXPIRY) {
          return 'none';
        }
        
        return connection.status;
      },

      addRecentUser: (userId, userName) => {
        if (!userId || !userName || userName === 'User' || userName === 'Unknown User') {
          return;
        }

        set((state) => {
          state.recentUsers[userId] = userName;
          
          // Keep only last 50 recent users to prevent memory bloat
          const entries = Object.entries(state.recentUsers);
          if (entries.length > 50) {
            const recent = entries.slice(-50);
            state.recentUsers = Object.fromEntries(recent);
          }
        });
      },

      getRecentUsers: () => {
        return get().recentUsers;
      },

      clearExpiredConnections: () => {
        set((state) => {
          const now = Date.now();
          Object.keys(state.connections).forEach((key) => {
            if (now - state.connections[key].updatedAt > CONNECTION_EXPIRY) {
              delete state.connections[key];
            }
          });
        });
      },
    })),
    {
      name: 'cenopie-connections',
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: (state) => ({
        connections: state.connections,
        recentUsers: state.recentUsers,
      }),
    }
  )
);

// Selectors for better performance
export const useConnectionStatus = (currentUserId: string, targetUserId: string) =>
  useConnectionStore((state) => state.getConnectionStatus(currentUserId, targetUserId));

export const useConnectionActions = () => useConnectionStore((state) => ({
  updateConnectionStatus: state.updateConnectionStatus,
  addRecentUser: state.addRecentUser,
  getRecentUsers: state.getRecentUsers,
  clearExpiredConnections: state.clearExpiredConnections,
}));

// Auto-cleanup expired connections on app start
if (typeof window !== 'undefined') {
  useConnectionStore.getState().clearExpiredConnections();
}