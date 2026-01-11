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
    if (message.status === 'failed') return 'Failed';
    if (message.readBy.length > 0) return 'Read';
    if (message.deliveredTo.length > 0) return 'Delivered';
    return 'Sent';
  };

  const getStatusIcon = () => {
    if (message.status === 'failed') {
      return <span className="text-red-500 text-xs">!</span>;
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
          {message.replyTo.sender.name}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {message.replyTo.content || 'Attachment'}
        </p>
      </div>
    );
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group ${className}`}>
      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="flex-shrink-0">
            <Avatar className="w-8 h-8">
              <AvatarImage 
                src={message.sender.profileImage} 
                alt={message.sender.name}
              />
              <AvatarFallback className="bg-[#0BC0DF] text-white text-xs">
                {message.sender.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name for non-own messages */}
          {!isOwn && showAvatar && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {message.sender.name}
              </span>
              {message.sender.isVerified && (
                <VerificationBadge isVerified={true} size="sm" />
              )}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`relative rounded-2xl px-4 py-2 ${
              isOwn
                ? 'bg-[#0BC0DF] text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
            }`}
          >
            {renderReplyTo()}
            
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            
            {renderAttachments()}
          </div>

          {/* Timestamp and status */}
          {showTimestamp && (
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(message.createdAt)}
                {message.edited && ' (edited)'}
              </span>
              {isOwn && (
                <div className="flex items-center" title={getMessageStatus()}>
                  {getStatusIcon()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message actions - only three dots menu */}
        <div className={`flex-shrink-0 flex items-start pt-2 opacity-0 group-hover:opacity-100 transition-opacity ${
          isOwn 
            ? 'order-first mr-2' // For own messages: buttons on left side
            : 'ml-2'             // For received messages: buttons on right side
        }`}>
          <div className="flex items-center gap-1">
            {/* More actions - only three dots menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                >
                  <EllipsisHorizontalIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'start' : 'end'}>
                {onReply && (
                  <DropdownMenuItem onClick={() => onReply(message)}>
                    <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                    Reply
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
      </div>
    </div>
  );
}