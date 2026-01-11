"use client";
import { useState, useEffect, useRef } from 'react';
import { BellIcon, BriefcaseIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import VerificationBadge from '@/components/VerificationBadge';

type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'job' | 'system' | 'connection_request';

interface Notification {
  _id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  relatedUser?: { 
    _id: string;
    name: string;
    headline?: string;
    profileImage?: string;
    isVerified?: boolean;
  } | null;
  link?: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com'}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.slice(0, 5)); // Show only latest 5
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'job':
        return <BriefcaseIcon className="w-4 h-4 text-blue-500" />;
      case 'connection_request':
      case 'follow':
        return <UserPlusIcon className="w-4 h-4 text-green-500" />;
      default:
        return <BellIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (dateString: string) => {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors min-h-touch min-w-touch flex items-center justify-center"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-base sm:text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="px-2 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
            <Link
              href="/notifications"
              className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              onClick={() => setIsOpen(false)}
            >
              All
            </Link>
            <Link
              href="/notifications?tab=jobs"
              className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 whitespace-nowrap"
              onClick={() => setIsOpen(false)}
            >
              <BriefcaseIcon className="w-3 h-3" />
              <span>Jobs</span>
            </Link>
            <Link
              href="/notifications?tab=unread"
              className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              onClick={() => setIsOpen(false)}
            >
              Unread
            </Link>
            <Link
              href="/notifications?tab=connections"
              className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 whitespace-nowrap"
              onClick={() => setIsOpen(false)}
            >
              <UserPlusIcon className="w-3 h-3" />
              <span>Connections</span>
            </Link>
          </div>

          {/* Notifications List */}
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto smooth-scroll">
            {loading ? (
              <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-sm text-gray-500">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-sm text-gray-500">
                <BellIcon className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`
                    px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors active:scale-[0.99]
                    ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                  `}
                >
                  <div className="flex gap-2 sm:gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm break-words ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.message}
                      </p>
                      {notification.relatedUser?.name && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center space-x-1">
                          <span>From: {notification.relatedUser.name}</span>
                          <VerificationBadge isVerified={notification.relatedUser.isVerified} size="sm" />
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/notifications"
                className="block text-center text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}