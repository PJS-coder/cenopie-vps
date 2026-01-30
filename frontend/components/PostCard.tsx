"use client";
import { useState, useRef, useEffect, memo, useCallback } from 'react';
import Image from 'next/image';
import { HeartIcon, ChatBubbleOvalLeftIcon, ArrowPathRoundedSquareIcon, ShareIcon, BookmarkIcon, EllipsisHorizontalIcon, TrashIcon, ChatBubbleLeftIcon, ArrowsRightLeftIcon, EnvelopeIcon, UserPlusIcon, XMarkIcon, LinkIcon, AtSymbolIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import VerificationBadge from './VerificationBadge';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import RepostModal from '@/components/RepostModalNew';
import ConnectButton from '@/components/ConnectButton';
import { useToastContext } from '@/components/ToastProvider';
import { addRecentUser } from '@/lib/connectionUtils';
import ConfirmModal from '@/components/ConfirmModal';
import MinimalVideoPlayer from '@/components/CustomVideoPlayer';



// Simple time formatting function to replace date-fns
const formatDistanceToNow = (date: Date | string) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + 'm ago';
  if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + 'h ago';
  if (diffInSeconds < 2592000) return Math.floor(diffInSeconds / 86400) + 'd ago';
  return Math.floor(diffInSeconds / 2592000) + 'mo ago';
};

// Memoized components for better performance
const CommentItem = memo(({ comment, currentUserId, onDeleteComment, postId }: { comment: any; currentUserId: string; onDeleteComment: (commentId: string) => void; postId: string }) => (
  <div key={comment.id} className="flex gap-2 py-1.5">
    <Avatar className="h-7 w-7 shrink-0">
      {comment.profileImage ? (
        <Image
          src={comment.profileImage}
          alt={comment.author}
          width={28}
          height={28}
          className="rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <AvatarFallback className="bg-brand/10 text-brand text-xs">
          {comment.author.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      )}
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="font-medium text-xs flex items-center space-x-1">
          <span>{comment.author}</span>
          <VerificationBadge isVerified={comment.isVerified} size="sm" />
        </span>
        <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
        {comment.authorId === currentUserId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => onDeleteComment(comment.id)}
          >
            Delete
          </Button>
        )}
      </div>
      <p className="text-xs leading-relaxed break-words">{comment.text}</p>
    </div>
  </div>
));

CommentItem.displayName = 'CommentItem';

interface PostCardProps {
  id: string;
  author?: string;
  role?: string;
  content?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  commentDetails?: {
    id: string;
    author: string;
    authorId?: string;
    profileImage?: string;
    text: string;
    createdAt: string;
    isVerified?: boolean;
  }[];
  timestamp?: string;
  image?: string;
  mediaType?: string;
  imageAlt?: string;
  isUserConnected?: boolean;
  currentUserId?: string;
  postAuthorId?: string;
  profileImage?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, commentText?: string) => void;
  onShare?: (postId: string) => void;
  onRepost?: (postId: string, repostComment?: string) => void;
  onSave?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onMessage?: (userId: string) => void;
  isLiked?: boolean;
  isSaved?: boolean;
  isRepost?: boolean;
  isVerified?: boolean;
  originalPost?: {
    id: string;
    author: string;
    role?: string;
    content: string;
    likes: number;
    comments: number;
    commentDetails?: {
      id: string;
      author: string;
      authorId?: string;
      profileImage?: string;
      text: string;
      createdAt: string;
      isVerified?: boolean;
    }[];
    shares: number;
    timestamp?: string;
    image?: string;
    mediaType?: string;
    authorId?: string;
    profileImage?: string;
    isConnected?: boolean;
    isLiked?: boolean;
    isVerified?: boolean;
  } | null;
}

const PostCard = ({
  id,
  author,
  role,
  content,
  likes = 0,
  comments = 0,
  shares = 0,
  timestamp,
  image,
  mediaType,
  isUserConnected = false,
  currentUserId,
  postAuthorId,
  profileImage,
  onLike,
  onComment,
  onShare,
  onRepost,
  onSave,
  onDelete,
  onDeleteComment,
  onMessage,
  isLiked = false,
  isSaved = false,
  isRepost = false,
  isVerified = false,
  originalPost,
  commentDetails = []
}: PostCardProps) => {
  const router = useRouter();
  const toast = useToastContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Debug logging
  console.log(`PostCard ${id} - Props received:`, {
    id,
    author,
    isRepost,
    hasOriginalPost: !!originalPost,
    originalPostAuthor: originalPost?.author,
    commentDetails: commentDetails?.length || 0,
    comments,
    showCommentInput
  });

  if (isRepost && originalPost) {
    console.log(`✅ PostCard ${id} - REPOST PROPS:`, {
      isRepost,
      originalPost: {
        id: originalPost.id,
        author: originalPost.author,
        content: originalPost.content?.substring(0, 50) + '...'
      }
    });
  } else if (isRepost && !originalPost) {
    console.log(`❌ PostCard ${id} - REPOST WITHOUT ORIGINAL POST:`, { isRepost, originalPost });
  }

  // Check if the current user is the author of the post
  const isPostAuthor = currentUserId && postAuthorId && currentUserId === postAuthorId;

  const handleLike = useCallback(() => {
    console.log('PostCard handleLike clicked for post:', id);
    console.log('Current isLiked state:', isLiked);
    console.log('Current likes count:', likes);

    if (onLike) {
      onLike(id);
    }
  }, [id, isLiked, likes, onLike]);

  // Load comments for preview if they exist but aren't loaded yet
  useEffect(() => {
    if (comments > 0 && commentDetails.length === 0 && onComment) {
      console.log(`Auto-loading comments for preview - post ${id}`);
      onComment(id); // Load comments for preview
    }
  }, [comments, commentDetails.length, id, onComment]);

  const handleComment = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onComment) {
      // If there are no comment details but comments count > 0, load them
      if (comments > 0 && commentDetails.length === 0) {
        console.log(`Loading comments for post ${id} - count: ${comments}, details: ${commentDetails.length}`);
        await onComment(id); // Load comments without text
      } else {
        onComment(id); // Just notify that comment section was opened
      }
    }
    
    // Toggle comment input visibility
    setShowCommentInput(!showCommentInput);
  }, [id, onComment, comments, commentDetails.length, showCommentInput]);

  const handleCommentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && onComment) {
      try {
        // Check if user is still authenticated
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('User not authenticated, skipping comment submission');
          return;
        }

        await onComment(id, commentText);
        setCommentText('');
        // Keep comment input visible after submitting
        // setShowCommentInput(false); // Removed this line to keep comments open
      } catch (error) {
        // Only show error if user is still authenticated
        const token = localStorage.getItem('authToken');
        if (token) {
          console.error('Failed to submit comment:', error);
          toast.error('Failed to add comment: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      }
    }
  }, [commentText, id, onComment, toast]);

  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleRepostClick = useCallback(() => {
    setShowRepostModal(true);
  }, []);

  const handleRepost = useCallback(async (repostComment?: string) => {
    if (onRepost) {
      await onRepost(id, repostComment);
    }
    setShowRepostModal(false);
  }, [id, onRepost]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(id);
    }
  }, [id, onSave]);

  const handleDelete = useCallback(async () => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (onDelete) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Failed to delete post:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Failed to delete post: ' + errorMessage);
      }
    }
  }, [id, onDelete, toast]);

  const handleMessage = useCallback(() => {
    if (!postAuthorId) {
      console.error('Unable to message user: missing postAuthorId');
      return;
    }

    if (author && author !== 'User' && author !== 'Unknown User') {
      addRecentUser(postAuthorId, author);
    }

    if (onMessage) {
      onMessage(postAuthorId);
      return;
    }

    const userName = author && author !== 'User' && author !== 'Unknown User'
      ? encodeURIComponent(author)
      : '';

    router.push(`/chats?user=${postAuthorId}${userName ? `&name=${userName}` : ''}`);
  }, [author, onMessage, postAuthorId, router]);

  const handleViewProfile = useCallback(() => {
    if (postAuthorId) {
      router.push(`/profile/${postAuthorId}`);
    }
  }, [postAuthorId, router]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentConfirm(true);
  }, []);

  const confirmDeleteComment = useCallback(async () => {
    if (commentToDelete && onDeleteComment) {
      try {
        await onDeleteComment(id, commentToDelete);
      } catch (error) {
        console.error('Failed to delete comment:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Failed to delete comment: ' + errorMessage);
      }
    }
    setCommentToDelete(null);
  }, [id, commentToDelete, onDeleteComment, toast]);

  // Memoized delete comment handler
  const memoizedDeleteComment = useCallback((commentId: string) => {
    handleDeleteComment(commentId);
  }, [handleDeleteComment]);

  // Share functions
  const copyPostLink = async () => {
    const postUrl = `${window.location.origin}/posts/${id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Post link copied to clipboard!');
    }
    setShowShareModal(false);
  };

  const shareViaEmail = () => {
    const postUrl = `${window.location.origin}/posts/${id}`;
    const subject = `Check out this post by ${author} on Cenopie`;
    const body = `Hi,\n\nI wanted to share this interesting post with you:\n\n"${content?.slice(0, 100)}${content && content.length > 100 ? '...' : ''}"\n\nView the full post: ${postUrl}\n\nBest regards`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setShowShareModal(false);
  };

  const shareViaWhatsApp = () => {
    const postUrl = `${window.location.origin}/posts/${id}`;
    const message = `Check out this post by ${author} on Cenopie: ${postUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    setShowShareModal(false);
  };

  const shareViaLinkedIn = () => {
    const postUrl = `${window.location.origin}/posts/${id}`;
    const text = `Check out this post by ${author} on Cenopie`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(text)}`);
    setShowShareModal(false);
  };

  const shareViaTwitter = () => {
    const postUrl = `${window.location.origin}/posts/${id}`;
    const text = `Check out this post by ${author} on Cenopie`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`);
    setShowShareModal(false);
  };

  return (
    <>
      {/* Repost Modal */}
      <RepostModal
        isOpen={showRepostModal}
        onClose={() => setShowRepostModal(false)}
        onRepost={handleRepost}
        originalPost={{
          author: author || 'Unknown User',
          role: role,
          content: content || '',
          image: image,
          mediaType: mediaType,
          profileImage: profileImage,
          timestamp: timestamp,
          isVerified: isVerified
        }}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Share Post</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={copyPostLink}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-[#0BC0DF]/10 rounded-full flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-[#0BC0DF]" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Copy Link</div>
                  <div className="text-sm text-gray-500">Copy post URL to clipboard</div>
                </div>
              </button>

              <button
                onClick={shareViaEmail}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-500">Share via email</div>
                </div>
              </button>

              <button
                onClick={shareViaWhatsApp}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <ChatBubbleLeftIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">WhatsApp</div>
                  <div className="text-sm text-gray-500">Share via WhatsApp</div>
                </div>
              </button>

              <button
                onClick={shareViaLinkedIn}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-blue-700" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">LinkedIn</div>
                  <div className="text-sm text-gray-500">Share on LinkedIn</div>
                </div>
              </button>

              <button
                onClick={shareViaTwitter}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                  <AtSymbolIcon className="w-5 h-5 text-sky-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Twitter</div>
                  <div className="text-sm text-gray-500">Share on Twitter</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Repost header - only show if this is a repost */}
        {isRepost && originalPost && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 px-3 pt-2 pb-1.5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
            <ArrowsRightLeftIcon className="h-3.5 w-3.5 text-brand" />
            <span className="font-medium text-brand">{author}</span>
            <span>reposted</span>
            <span className="font-medium">{originalPost.author}'s</span>
            <span>post</span>
          </div>
        )}

        <CardHeader className="pb-2 px-3 pt-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="cursor-pointer"
                onClick={handleViewProfile}
              >
                <Avatar className="h-12 w-12 shrink-0">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt={author || 'User'}
                      width={48}
                      height={48}
                      className="w-full h-full rounded-full object-cover stable-image"
                      loading="lazy"
                      priority={false}
                      unoptimized={false}
                    />
                  ) : (
                    <AvatarFallback className="bg-brand/10 text-brand font-semibold text-sm">
                      {author?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="min-w-0 flex-1">
                <h4
                  className="font-bold text-base truncate cursor-pointer hover:text-blue-600 transition-colors flex items-center space-x-1"
                  onClick={handleViewProfile}
                >
                  <span>{author}</span>
                  <VerificationBadge isVerified={isVerified} size="sm" />
                </h4>
                <p className="text-sm text-muted-foreground truncate">{role}</p>
                <p className="text-xs text-muted-foreground">{timestamp}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Connect button - only show if not the post author */}
              {postAuthorId && currentUserId && currentUserId !== postAuthorId && (
                <ConnectButton
                  userId={postAuthorId}
                  userName={author || 'User'}
                  currentUserId={currentUserId}
                  initialStatus={isUserConnected ? 'accepted' : 'none'}
                  size="sm"
                />
              )}

              {/* Message button - only show if not the post author */}
              {postAuthorId && currentUserId !== postAuthorId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-9 h-9 p-2 rounded-full flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-[#0BC0DF] hover:text-white"
                  onClick={handleMessage}
                  title="Send message"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                </Button>
              )}

              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <EllipsisHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    className={isSaved ? 'cursor-pointer text-blue-600' : 'cursor-pointer'}
                    onClick={handleSave}
                  >
                    <BookmarkIcon className={isSaved ? 'h-3.5 w-3.5 mr-1.5 fill-current' : 'h-3.5 w-3.5 mr-1.5'} />
                    {isSaved ? 'Saved' : 'Save post'}
                  </DropdownMenuItem>
                  {isPostAuthor && (
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                        setMenuOpen(false);
                      }}
                    >
                      <TrashIcon className="h-3.5 w-3.5 mr-1.5" />
                      Delete Post
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-2 px-0">
          {/* Main post content */}
          {content && (
            <p className="text-sm leading-relaxed break-words px-3 pb-2">{content}</p>
          )}

          {/* Main post image - Single image only */}
          {!isRepost && image && (() => {
            // Handle old multiple image posts - show only the first image
            if (mediaType === 'multiple') {
              try {
                const images = JSON.parse(image);
                if (Array.isArray(images) && images.length > 0) {
                  const firstImage = images[0];
                  return (
                    <div className="relative w-full mb-3">
                      <div className="relative group cursor-pointer w-full bg-gray-50 dark:bg-gray-800">
                        <Image
                          src={firstImage.url}
                          alt={`Post image by ${author || 'User'}`}
                          width={600}
                          height={400}
                          className="w-full h-auto max-h-[500px] object-contain transition-opacity duration-200 group-hover:opacity-95"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading="lazy"
                          priority={false}
                          unoptimized={false}
                        />
                        {/* Multiple images indicator */}
                        {images.length > 1 && (
                          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                            +{images.length - 1} more
                          </div>
                        )}
                        {/* Subtle hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                      </div>
                    </div>
                  );
                }
              } catch (e) {
                console.error('Error parsing old multiple images:', e);
                return (
                  <div className="relative w-full mb-3 bg-gray-100 dark:bg-gray-800 p-4 text-center text-gray-500">
                    Unable to load images
                  </div>
                );
              }
            }

            // Regular single image/video display
            return (
              <div className="relative w-full mb-3">
                {mediaType === 'video' ? (
                  <div className="relative w-full bg-gray-50 dark:bg-gray-800">
                    <MinimalVideoPlayer
                      src={image}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="relative group cursor-pointer w-full bg-gray-50 dark:bg-gray-800">
                    <Image
                      src={image}
                      alt={`Post image by ${author || 'User'}`}
                      width={600}
                      height={400}
                      className="w-full h-auto max-h-[500px] object-contain transition-opacity duration-200 group-hover:opacity-95"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      loading="lazy"
                      priority={false}
                      unoptimized={false}
                    />
                    {/* Subtle hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Original post content for reposts */}
          {isRepost && originalPost && (
            <Card className="border-l-2 border-l-brand bg-gray-50 dark:bg-gray-900/30 rounded-md mx-3 mt-2">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-10 w-10">
                    {originalPost.profileImage ? (
                      <Image
                        src={originalPost.profileImage}
                        alt={originalPost.author}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <AvatarFallback className="bg-brand/10 text-brand text-xs">
                        {originalPost.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <span className="font-bold text-sm">{originalPost.author}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">{originalPost.role}</span>
                  </div>
                </div>
                {originalPost.content && (
                  <p className="text-sm leading-relaxed mb-2">{originalPost.content}</p>
                )}
                {originalPost.image && (
                  <div className="relative w-full bg-gray-50 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-600/50 mt-2">
                    {originalPost.mediaType === 'video' ? (
                      <div className="relative w-full">
                        <MinimalVideoPlayer
                          src={originalPost.image}
                          className="w-full max-h-[400px]"
                        />
                      </div>
                    ) : (
                      <div className="relative group cursor-pointer w-full">
                        <Image
                          src={originalPost.image}
                          alt="Original post image"
                          width={600}
                          height={400}
                          className="w-full h-auto max-h-[400px] object-contain transition-opacity duration-200 group-hover:opacity-95"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading="lazy"
                        />
                        {/* Subtle hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>

        <CardFooter className="px-0 py-0">
          <div className="w-full">
            {/* Action buttons - Modern Design */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 px-3 py-2 rounded-full h-9 transition-all duration-200 ${isLiked
                    ? 'text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
                    : 'text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                    }`}
                  onClick={handleLike}
                >
                  <HeartIcon className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{likes}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 px-3 py-2 rounded-full h-9 transition-all duration-200 ${
                    showCommentInput
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50'
                      : commentDetails.length > 0
                      ? 'text-blue-500 bg-blue-25 dark:bg-blue-950/20 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                  }`}
                  onClick={handleComment}
                >
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{commentDetails.length || comments}</span>
                </Button>

                {/* Only show repost button if user is not the post author */}
                {!isPostAuthor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 px-3 py-2 rounded-full h-9 text-gray-600 dark:text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all duration-200"
                    onClick={handleRepostClick}
                  >
                    <ArrowsRightLeftIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{shares}</span>
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 rounded-full h-9 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                onClick={handleShare}
              >
                <ShareIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Share</span>
              </Button>
            </div>

            {/* Comment Preview - Show 2-3 comments when section is closed */}
            {!showCommentInput && commentDetails.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
                <div className="space-y-2">
                  {commentDetails.slice(0, 2).map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId || ''}
                      onDeleteComment={memoizedDeleteComment}
                      postId={id}
                    />
                  ))}
                  {commentDetails.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowCommentInput(true);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      View all {commentDetails.length} comments
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Full Comments Section - Show when comment input is active */}
            {showCommentInput && (
              <div className="border-t border-gray-100 dark:border-gray-800">
                {/* Comments Header with Close Button */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {commentDetails.length > 0 ? `Comments (${commentDetails.length})` : 'Comments'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowCommentInput(false)}
                    title="Close comments"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* All Comments */}
                {commentDetails.length > 0 && (
                  <div className="space-y-2 px-4 pb-2 max-h-80 overflow-y-auto">
                    {commentDetails.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        currentUserId={currentUserId || ''}
                        onDeleteComment={memoizedDeleteComment}
                        postId={id}
                      />
                    ))}
                  </div>
                )}
                
                {/* Comment input */}
                <div className="p-4 pt-2 pb-3">
                  <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <Input
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 text-sm h-10"
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-10 px-4" disabled={!commentText.trim()}>
                      <span className="text-sm">Post</span>
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Delete Post Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      {/* Delete Comment Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteCommentConfirm}
        onClose={() => {
          setShowDeleteCommentConfirm(false);
          setCommentToDelete(null);
        }}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default memo(PostCard);