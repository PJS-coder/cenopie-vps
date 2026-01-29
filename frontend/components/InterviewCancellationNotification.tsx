"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useInterviewCancellation } from '@/hooks/useInterviewCancellation';

export function InterviewCancellationNotification() {
  const router = useRouter();
  const { cancellationInfo, showCancellationMessage, dismissCancellation } = useInterviewCancellation();

  if (!showCancellationMessage || !cancellationInfo) {
    return null;
  }

  const getIcon = () => {
    if (cancellationInfo.reason === 'cheating') {
      return <XCircleIcon className="w-8 h-8 text-red-500" />;
    }
    return <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />;
  };

  const getBackgroundColor = () => {
    if (cancellationInfo.reason === 'cheating') {
      return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
    }
    return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
  };

  const getTextColor = () => {
    if (cancellationInfo.reason === 'cheating') {
      return 'text-red-800 dark:text-red-200';
    }
    return 'text-orange-800 dark:text-orange-200';
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className={`rounded-xl shadow-2xl border-2 p-4 backdrop-blur-sm ${getBackgroundColor()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-lg mb-2 ${getTextColor()}`}>
              Interview Cancelled!
            </h3>
            <p className={`text-sm mb-4 ${getTextColor()}`}>
              {cancellationInfo.message}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={dismissCancellation}
                className="flex-1"
              >
                OK
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  dismissCancellation();
                  router.push('/interviews/new');
                }}
                className="flex-1"
              >
                Start New Interview
              </Button>
            </div>
          </div>
          <button
            onClick={dismissCancellation}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}