'use client';

import { Message } from '@/lib/messageApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  EllipsisHorizontalIcon, 
  ArrowUturnLeftIcon,
  TrashIcon,
  CheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import VerificationBadge from '@/components/VerificationBadge';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  currentUserId: string;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string, deleteForEveryone?: boolean) => void;
  className?: string;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  currentUserId,
  onReply,
  onDelete,
  className = ''
}: MessageBubbleProps) {

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getMessageStatus = () => {
    if (message.status === 'sending') return 'Sending';
    if (message.status === 'failed') return 'Failed to send';
    if (message.readBy.length > 0) return 'Read';
    if (message.deliveredTo.length > 0) return 'Delivered';
    return 'Sent';
  };

  const getStatusIcon = () => {
    if (message.status === 'sending') {
      return <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />;
    }
    if (message.status === 'failed') {
      return <span className="text-red-500 text-xs font-bold">!</span>;
    }
    if (message.readBy.length > 0) {
      return <CheckCircleIcon className="w-3 h-3 text-blue-500" />;
    }
    if (message.deliveredTo.length > 0) {
      return <CheckCircleIcon className="w-3 h-3 text-gray-400" />;
    }
    return <CheckIcon className="w-3 h-3 text-gray-400" />;
  };

  const canDeleteForEveryone = () => {
    if (!isOwn) return false;
    const messageTime = new Date(message.createdAt);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return messageTime > oneHourAgo;
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((attachment, index) => (
          <div key={index} className="rounded-lg overflow-hidden">
            {attachment.type === 'image' && (
              <img
                src={attachment.url}
                alt={attachment.filename || 'Image'}
                className="max-w-xs max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(attachment.url, '_blank')}
              />
            )}
            {attachment.type === 'file' && (
              <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {attachment.filename?.split('.').pop()?.toUpperCase() || 'FILE'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {attachment.filename || 'Unknown file'}
                  </p>
                  {attachment.size && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(attachment.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(attachment.url, '_blank')}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Download
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderReplyTo = () => {
    if (!message.replyTo) return null;

    return (
      <div className="mb-2 p-2 border-l-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-r">
        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          {message.replyTo.sender?.name || 'Unknown User'}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {message.replyTo.content || 'Attachment'}
        </p>
      </div>
    );
  };

  return (
    <div className={`flex w-full px-2 py-0.5 md:py-1 group ${className}`}>
      <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex gap-2 max-w-[75%] sm:max-w-[65%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar - only for received messages */}
          {showAvatar && !isOwn && (
            <div className="flex-shrink-0 self-end">
              <Avatar className="w-7 h-7">
                <AvatarImage 
                  src={message.sender?.profileImage} 
                  alt={message.sender?.name || 'User'}
                />
                <AvatarFallback className="bg-[#0BC0DF] text-white text-xs">
                  {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Message Content Container */}
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} relative`}>
            {/* Sender name for received messages */}
            {!isOwn && showAvatar && (
              <div className="flex items-center gap-1 mb-1 px-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {message.sender?.name || 'Unknown User'}
                </span>
                {message.sender?.isVerified && (
                  <VerificationBadge isVerified={true} size="sm" />
                )}
              </div>
            )}

            {/* Message bubble with hover actions */}
            <div className={`relative group/message ${isOwn ? 'flex flex-row-reverse items-center gap-1' : 'flex items-center gap-1'}`}>
              {/* Message bubble */}
              <div
                className={`relative px-3 py-2 max-w-full ${
                  isOwn
                    ? 'bg-[#0BC0DF] text-white rounded-2xl rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-md'
                }`}
              >
                {renderReplyTo()}
                
                {message.content && (
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </p>
                )}
                
                {renderAttachments()}
              </div>

              {/* Message actions - Three dots menu */}
              <div className="opacity-0 group-hover/message:opacity-100 transition-opacity duration-200 flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-6 h-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                    >
                      <EllipsisHorizontalIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? 'start' : 'end'} className="w-48">
                    {onReply && (
                      <DropdownMenuItem onClick={() => onReply(message)}>
                        <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                    )}
                    {isOwn && message.status === 'failed' && (
                      <DropdownMenuItem onClick={() => {
                        // Retry sending the message
                        console.log('Retry sending message:', message._id);
                        // TODO: Implement retry functionality
                      }}>
                        <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                        Retry
                      </DropdownMenuItem>
                    )}
                    {isOwn && onDelete && (
                      <>
                        <DropdownMenuItem onClick={() => onDelete(message._id, false)}>
                          <TrashIcon className="w-4 h-4 mr-2" />
                          Delete for me
                        </DropdownMenuItem>
                        {canDeleteForEveryone() && (
                          <DropdownMenuItem onClick={() => onDelete(message._id, true)}>
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Delete for everyone
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Timestamp and status */}
            {showTimestamp && (
              <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(message.createdAt)}
                  {message.edited && ' (edited)'}
                </span>
                {isOwn && (
                  <div className="flex items-center ml-1" title={getMessageStatus()}>
                    {getStatusIcon()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Spacer for sent messages to maintain consistent spacing */}
          {isOwn && showAvatar && (
            <div className="w-7 flex-shrink-0"></div>
          )}
        </div>
      </div>
    </div>
  );
}