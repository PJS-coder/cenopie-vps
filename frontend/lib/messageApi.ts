import { authenticatedRequest, ApiResponse } from './api';

export interface User {
  _id: string;
  name: string;
  profileImage?: string;
  isVerified?: boolean;
}

export interface Attachment {
  type: 'image' | 'file' | 'audio' | 'video' | 'location';
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: User;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'location';
  content?: string;
  attachments?: Attachment[];
  replyTo?: {
    _id: string;
    content: string;
    sender: User;
    type: string;
  };
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reactions: Array<{
    user: string;
    emoji: string;
    createdAt: string;
  }>;
  edited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  readBy: Array<{
    user: string;
    readAt: string;
  }>;
  deliveredTo: Array<{
    user: string;
    deliveredAt: string;
  }>;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  isVerified?: boolean;
  lastMessage?: Message;
  lastActivity: string;
  unreadCount: number;
  participantCount: number;
  participants?: Array<{
    user: User;
    role: 'member' | 'admin' | 'owner';
    joinedAt: string;
    isActive: boolean;
  }>;
  otherParticipant?: User;
}

export interface SendMessageData {
  conversationId: string;
  content?: string;
  type?: 'text' | 'image' | 'file' | 'audio' | 'video' | 'location';
  replyTo?: string;
  attachments?: Attachment[];
  clientId?: string;
}

export interface MessageSearchResult {
  messages: Message[];
  searchTerm: string;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

class MessageAPI {
  // Get all conversations for the current user
  async getConversations(params?: {
    page?: number;
    limit?: number;
    includeArchived?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return await authenticatedRequest(`/api/messages/conversations${queryString}`);
  }

  // Get or create a direct conversation with another user
  async getOrCreateDirectConversation(userId: string) {
    return await authenticatedRequest(`/api/messages/conversations/${userId}/direct`);
  }

  // Get messages for a specific conversation
  async getMessages(conversationId: string, params?: {
    page?: number;
    limit?: number;
    before?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return await authenticatedRequest(`/api/messages/conversations/${conversationId}/messages${queryString}`);
  }

  // Send a message
  async sendMessage(data: SendMessageData) {
    return await authenticatedRequest('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  // Search messages
  async searchMessages(params: {
    q: string;
    conversationId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<MessageSearchResult>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return await authenticatedRequest(`/api/messages/search${queryString}`);
  }

  // Mark message as read
  async markMessageAsRead(messageId: string) {
    return await authenticatedRequest(`/api/messages/messages/${messageId}/read`, {
      method: 'PATCH',
    });
  }

  // Add reaction to message
  async addReaction(messageId: string, emoji: string) {
    return await authenticatedRequest(`/api/messages/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    });
  }

  // Remove reaction from message
  async removeReaction(messageId: string) {
    return await authenticatedRequest(`/api/messages/messages/${messageId}/reactions`, {
      method: 'DELETE',
    });
  }

  // Delete message
  async deleteMessage(messageId: string, deleteForEveryone = false) {
    return await authenticatedRequest(`/api/messages/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteForEveryone }),
    });
  }

  // Archive/unarchive conversation
  async archiveConversation(conversationId: string, archived = true) {
    return await authenticatedRequest(`/api/messages/conversations/${conversationId}/archive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
  }

  // Upload file for message attachment
  async uploadFile(file: File, type: 'image' | 'file' | 'audio' | 'video' = 'file') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return await authenticatedRequest('/api/upload/message-attachment', {
      method: 'POST',
      body: formData,
    });
  }

  // Legacy API methods for backward compatibility
  async getChats() {
    return await authenticatedRequest('/api/messages/chats');
  }

  async getMessagesLegacy(userId: string) {
    return await authenticatedRequest(`/api/messages/${userId}`);
  }

  async sendMessageLegacy(to: string, text: string) {
    return await authenticatedRequest('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, text }),
    });
  }
}

export const messageApi = new MessageAPI();