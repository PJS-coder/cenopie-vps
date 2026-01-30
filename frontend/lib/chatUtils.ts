import { getApiUrl } from './apiUrl';

export interface ChatUser {
  id: string;
  name: string;
  profileImage?: string;
}

export interface Chat {
  id: string;
  participants: ChatUser[];
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

/**
 * Create or get existing chat with a specific user
 */
export const createOrGetChat = async (otherUserId: string): Promise<Chat> => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${getApiUrl()}/api/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ otherUserId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create chat');
  }

  const data = await response.json();
  
  // Format the response to match our Chat interface
  return {
    id: data.chat._id,
    participants: data.chat.participants,
    lastMessage: data.chat.lastMessage,
    unreadCount: 0 // New chats start with 0 unread
  };
};

/**
 * Get user info by ID (for displaying user details when starting a chat)
 */
export const getUserById = async (userId: string): Promise<ChatUser | null> => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return {
      id: user._id || user.id,
      name: user.name || 'Unknown User',
      profileImage: user.profileImage
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};