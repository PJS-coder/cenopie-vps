'use client';

import { useState } from 'react';
import { UserPlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import VerificationBadge from '@/components/VerificationBadge';

interface ConnectionRequest {
  id: string;
  from: {
    _id: string;
    name: string;
    headline?: string;
    profileImage?: string;
    isVerified?: boolean;
  };
  createdAt: string;
}

export default function ConnectionRequestsBanner({ 
  requests, 
  loading, 
  error, 
  onAcceptRequest, 
  onRejectRequest,
  onRetry,
  acceptedRequests
}: { 
  requests: ConnectionRequest[];
  loading: boolean;
  error: string | null;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onRetry: () => void;
  acceptedRequests?: Set<string>;
}) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && requests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
        <div className="flex justify-center items-center h-16">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error && requests.length === 0) {
    // Check if it's a rate limit error
    const isRateLimitError = error.includes('Too many requests');
    const waitTime = isRateLimitError ? error.match(/\d+/)?.[0] || 'a few' : null;
    
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
        <div className="text-red-800 dark:text-red-200 font-medium">Error loading connection requests</div>
        <div className="text-red-600 dark:text-red-400 text-sm mt-1">
          {isRateLimitError 
            ? `Rate limited. Please wait ${waitTime} seconds before trying again.` 
            : error}
        </div>
        <button 
          onClick={onRetry}
          className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-sm rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Connection Requests ({requests.length})
        </h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {expanded ? 'Show Less' : 'Show All'}
        </button>
      </div>
      
      <div className="space-y-4">
        {(expanded ? requests : requests.slice(0, 1)).map((request) => (
          <div key={request.id} className="flex items-start gap-3">
            {request.from.profileImage ? (
              <img 
                src={request.from.profileImage} 
                alt={request.from.name} 
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {request.from.name.charAt(0)}
                </span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white truncate flex items-center space-x-1">
                <span>{request.from.name}</span>
                <VerificationBadge isVerified={request.from.isVerified} size="sm" />
              </h4>
              {request.from.headline && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {request.from.headline}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(request.createdAt)}
              </p>
            </div>
            
            <div className="flex gap-2">
              {acceptedRequests && acceptedRequests.has(request.id) ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500">
                  <CheckIcon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onAcceptRequest(request.id)}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
                    aria-label="Accept connection request"
                    disabled={loading}
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRejectRequest(request.id)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                    aria-label="Reject connection request"
                    disabled={loading}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        
        {!expanded && requests.length > 1 && (
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              +{requests.length - 1} more requests
            </p>
          </div>
        )}
      </div>
    </div>
  );
}