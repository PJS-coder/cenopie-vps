'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PaperAirplaneIcon, 
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Message } from '@/lib/messageApi';

interface MessageInputProps {
  onSendMessage: (content: string, replyTo?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  replyToMessage?: Message | null;
  onClearReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  replyToMessage,
  onClearReply,
  disabled = false,
  placeholder = "Type a message...",
  className = ''
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !typingTimeoutRef.current) {
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage) {
      return;
    }

    // Send message
    onSendMessage(
      trimmedMessage, 
      replyToMessage?._id
    );

    // Clear input
    setMessage('');
    
    // Clear reply
    if (onClearReply) {
      onClearReply();
    }

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onTypingStop();

    // Focus input
    inputRef.current?.focus();
  }, [message, replyToMessage, onSendMessage, onClearReply, onTypingStop]);

  return (
    <div className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:mb-0 ${className}`}>
      {/* Reply preview */}
      {replyToMessage && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Replying to {replyToMessage.sender.name}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {replyToMessage.content || 'Message'}
              </p>
            </div>
            {onClearReply && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearReply}
                className="w-6 h-6 p-0"
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 pb-safe lg:pb-3">
        <div className="flex items-end gap-2">
          {/* Message input */}
          <div className="flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="resize-none border-gray-200 dark:border-gray-600 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
            />
          </div>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={disabled || !message.trim()}
            className="bg-[#0BC0DF] hover:bg-[#0BC0DF]/90 text-white w-8 h-8 p-0"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}