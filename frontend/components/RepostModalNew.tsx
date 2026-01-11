'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { ArrowsRightLeftIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import VerificationBadge from '@/components/VerificationBadge';

interface RepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepost: (repostComment?: string) => void;
  originalPost: {
    author: string;
    role?: string;
    content: string;
    image?: string;
    mediaType?: string;
    profileImage?: string;
    timestamp?: string;
    isVerified?: boolean;
  };
}

export default function RepostModal({ 
  isOpen, 
  onClose, 
  onRepost,
  originalPost
}: RepostModalProps) {
  const [repostComment, setRepostComment] = useState('');
  const [isReposting, setIsReposting] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

  const handleSimpleRepost = async () => {
    setIsReposting(true);
    try {
      await onRepost();
      onClose();
    } catch (error) {
      console.error('Failed to repost:', error);
    } finally {
      setIsReposting(false);
    }
  };

  const handleRepostWithComment = () => {
    setShowCommentInput(true);
  };

  const handleSubmit = async () => {
    setIsReposting(true);
    try {
      await onRepost(repostComment.trim() || undefined);
      setRepostComment('');
      onClose();
    } catch (error) {
      console.error('Failed to repost with comment:', error);
    } finally {
      setIsReposting(false);
    }
  };

  const handleCancel = () => {
    if (showCommentInput) {
      setShowCommentInput(false);
      setRepostComment('');
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle>Repost</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {!showCommentInput ? (
              // Choice between repost options
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={handleSimpleRepost}
                  disabled={isReposting}
                >
                  <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
                  Repost
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={handleRepostWithComment}
                >
                  <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                  Repost with your thoughts
                </Button>
              </motion.div>
            ) : (
              // Comment input section
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4">
                  <Textarea
                    placeholder="Say something about this..."
                    value={repostComment}
                    onChange={(e) => setRepostComment(e.target.value)}
                    className="min-h-[80px]"
                    autoFocus
                  />
                </div>
                
                {/* Original post preview */}
                <div className="border-l-4 border-blue-500 pl-3 bg-gray-50 dark:bg-gray-900 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {originalPost.profileImage ? (
                        <Image 
                          src={originalPost.profileImage} 
                          alt={originalPost.author} 
                          width={24} 
                          height={24} 
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {originalPost.author.substring(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-sm">{originalPost.author}</span>
                      <VerificationBadge isVerified={originalPost.isVerified} size="sm" />
                      {originalPost.role && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{originalPost.role}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">{originalPost.content}</p>
                  {originalPost.image && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 mb-2">
                      {originalPost.mediaType === 'video' ? (
                        <video 
                          src={originalPost.image} 
                          controls 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image 
                          src={originalPost.image} 
                          alt="Post image" 
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  )}
                  {originalPost.timestamp && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{originalPost.timestamp}</p>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                disabled={isReposting}
              >
                Cancel
              </Button>
              {showCommentInput && (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isReposting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isReposting ? 'Reposting...' : 'Post'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}