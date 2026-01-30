"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BellIcon, UserGroupIcon, UserPlusIcon, CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useConnections, useConnectionRequests } from '@/hooks/useConnections';
import { profileApi } from '@/lib/api';
import VerificationBadge from '@/components/VerificationBadge';

interface CurrentUser {
  _id: string;
  name: string;
  profileImage?: string;
}

type TabType = 'notifications' | 'network';

interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedUser?: {
    _id: string;
    name: string;
    profileImage?: string;
    isVerified?: boolean;
  } | null;
}

interface ConnectionRequest {
  connectionId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    headline?: string;
    isVerified?: boolean;
  };
  message?: string;
  requestedAt: string;
}

export default function UpdatesPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const [networkSubTab, setNetworkSubTab] = useState<'requests' | 'connections' | 'sent'>('requests');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const { connections, loading: connectionsLoading } = useConnections();
  const { requests: receivedRequests, loading: receivedLoading, acceptRequest, declineRequest } = useConnectionRequests('received');
  const { requests: sentRequests, loading: sentLoading, cancelRequest } = useConnectionRequests('sent');

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await profileApi.getProfile();
        const userData = response.data?.user || response.user;
        if (userData) {
          setCurrentUser({
            _id: (userData as any)._id || (userData as any).id,
            name: (userData as any).name,
            profileImage: (userData as any).profileImage
          });
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Handle URL tab parameter
  useEffect(() => {
    if (tabParam === 'network') {
      setActiveTab('network');
      setNetworkSubTab('connections'); // Default to connections when coming from feed
    }
  }, [tabParam]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com'}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        // Dispatch event to update navbar count
        window.dispatchEvent(new Event('notificationUpdate'));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Fetch notifications when component mounts or when switching to notifications tab
  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);

  // Mark all notifications as read (now used automatically)
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com'}/api/notifications/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        // Dispatch event to update navbar count
        window.dispatchEvent(new Event('notificationUpdate'));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [notifications]);

  // Auto-mark notifications as read when they are viewed
  useEffect(() => {
    if (activeTab === 'notifications' && notifications.length > 0 && !notificationsLoading) {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        // Add a delay to ensure user actually sees the notifications
        const timer = setTimeout(() => {
          markAllAsRead();
        }, 2000); // 2 seconds delay to ensure user has time to see notifications

        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, notifications, notificationsLoading, markAllAsRead]);

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      await acceptRequest(connectionId);
    } catch (error) {
      alert('Failed to accept connection request');
    }
  };

  const handleDeclineRequest = async (connectionId: string) => {
    try {
      await declineRequest(connectionId);
    } catch (error) {
      alert('Failed to decline connection request');
    }
  };

  const handleCancelRequest = async (connectionId: string) => {
    try {
      await cancelRequest(connectionId);
    } catch (error) {
      alert('Failed to cancel connection request');
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full px-4 lg:px-6 py-6 flex justify-center">
          {/* Center content area with responsive width */}
          <div className="w-full lg:w-[1000px]">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <div>
                </div>
              </div>
            </div>

          {/* Compact Main Tabs */}
          <div className="mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <nav className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'notifications'
                      ? 'bg-[#0BC0DF] text-white shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  <BellIcon className="w-4 h-4 inline mr-1" />
                  Notifications
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('network')}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'network'
                      ? 'bg-[#0BC0DF] text-white shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <UserGroupIcon className="w-4 h-4 mr-1" />
                    Network
                    {receivedRequests.length > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full">
                        {receivedRequests.length > 9 ? '9+' : receivedRequests.length}
                      </span>
                    )}
                  </span>
                </button>
              </nav>
            </div>

            {/* Compact Network Sub-tabs */}
            {activeTab === 'network' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mt-3">
                <nav className="flex space-x-1">
                  <button
                    onClick={() => setNetworkSubTab('requests')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-sm transition-all ${
                      networkSubTab === 'requests'
                        ? 'bg-[#E6F7FC] text-[#0BC0DF]'
                        : 'text-gray-600'
                    }`}
                  >
                    <UserPlusIcon className="w-3 h-3 inline mr-1" />
                    Requests ({receivedRequests.length})
                  </button>
                  <button
                    onClick={() => setNetworkSubTab('connections')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-sm transition-all ${
                      networkSubTab === 'connections'
                        ? 'bg-[#E6F7FC] text-[#0BC0DF]'
                        : 'text-gray-600'
                    }`}
                  >
                    <UserGroupIcon className="w-3 h-3 inline mr-1" />
                    Connections ({connections.length})
                  </button>
                  <button
                    onClick={() => setNetworkSubTab('sent')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-sm transition-all ${
                      networkSubTab === 'sent'
                        ? 'bg-[#E6F7FC] text-[#0BC0DF]'
                        : 'text-gray-600'
                    }`}
                  >
                    <ClockIcon className="w-3 h-3 inline mr-1" />
                    Sent ({sentRequests.length})
                  </button>
                </nav>
              </div>
            )}

            {/* Tab Content */}
            <div className="px-0 py-4">
              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  {notificationsLoading ? (
                    <LoadingSkeleton variant="rectangular" />
                  ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12 text-center">
                      <div className="bg-[#E6F7FC] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BellIcon className="w-10 h-10 text-[#0BC0DF]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All caught up!</h3>
                      <p className="text-gray-600 dark:text-gray-400">You have no new notifications at the moment.</p>
                    </div>
                  ) : (
                    <>
                      {/* Auto-read info */}
                      {notifications.some(n => !n.read) && (
                        <div className="flex justify-center mb-4">
                          <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                            Notifications are automatically marked as read when viewed
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-3 rounded-xl border shadow-sm ${
                            notification.read
                              ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                              : 'bg-[#E6F7FC] dark:bg-blue-900/20 border-[#0BC0DF] dark:border-blue-800'
                          }`}
                        >
                          <div className="flex gap-2">
                            <div className="flex-shrink-0">
                              {notification.relatedUser?.profileImage ? (
                                <img
                                  src={notification.relatedUser.profileImage}
                                  alt={notification.relatedUser.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <UserGroupIcon className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm break-words ${!notification.read ? 'font-semibold' : ''}`}>
                                {notification.message}
                              </p>
                              {notification.relatedUser && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center space-x-1">
                                  <span>From: {notification.relatedUser.name}</span>
                                  <VerificationBadge isVerified={notification.relatedUser.isVerified} size="sm" />
                                </div>
                              )}
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-[#0BC0DF] rounded-full animate-pulse"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Network Tab Content */}
              {activeTab === 'network' && (
                <>
                  {/* Connection Requests Sub-tab */}
                  {networkSubTab === 'requests' && (
                <div>
                  {receivedLoading ? (
                    <LoadingSkeleton variant="rectangular" />
                  ) : receivedRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12 text-center">
                      <div className="bg-[#E6F7FC] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlusIcon className="w-10 h-10 text-[#0BC0DF]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No pending requests</h3>
                      <p className="text-gray-600 dark:text-gray-400">You don't have any connection requests at the moment.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {receivedRequests.map((request) => (
                        <div key={request.connectionId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                              {request.user.profileImage ? (
                                <Image
                                  src={request.user.profileImage}
                                  alt={request.user.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold text-sm">
                                  {getUserInitials(request.user.name)}
                                </div>
                              )}
                            </div>
                            <div>
                              <Link
                                href={`/profile/${request.user._id}`}
                                className="font-semibold text-base text-gray-900 dark:text-white hover:text-[#0BC0DF] transition-colors flex items-center space-x-1"
                              >
                                <span>{request.user.name}</span>
                                <VerificationBadge isVerified={request.user.isVerified} size="sm" />
                              </Link>
                              {request.user.headline && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {request.user.headline}
                                </p>
                              )}
                              {request.message && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 italic">
                                  "{request.message}"
                                </p>
                              )}
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
                                {formatDate(request.requestedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleAcceptRequest(request.connectionId)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckIcon className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => handleDeclineRequest(request.connectionId)}
                              size="sm"
                              variant="outline"
                            >
                              <XMarkIcon className="w-4 h-4 mr-1" />
                              Ignore
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

                  {/* Connections Sub-tab */}
                  {networkSubTab === 'connections' && (
                <div>
                  {connectionsLoading ? (
                    <LoadingSkeleton variant="rectangular" />
                  ) : connections.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12 text-center">
                      <div className="bg-[#E6F7FC] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserGroupIcon className="w-10 h-10 text-[#0BC0DF]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No connections yet</h3>
                      <p className="text-gray-600 dark:text-gray-400">Start building your professional network by connecting with colleagues and industry professionals.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {connections.map((connection) => (
                        <div key={connection.connectionId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                              {connection.user.profileImage ? (
                                <Image
                                  src={connection.user.profileImage}
                                  alt={connection.user.name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold">
                                  {getUserInitials(connection.user.name)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/profile/${connection.user._id}`}
                                className="font-semibold text-gray-900 dark:text-white hover:text-[#0BC0DF] transition-colors flex items-center space-x-1"
                              >
                                <span>{connection.user.name}</span>
                                <VerificationBadge isVerified={connection.user.isVerified} size="sm" />
                              </Link>
                              {connection.user.headline && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {connection.user.headline}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Connected on {formatDate(connection.connectedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Link href={`/chats?user=${connection.user._id}`}>
                              <Button size="sm" variant="outline" className="flex-1">
                                Message
                              </Button>
                            </Link>
                            <Link href={`/profile/${connection.user._id}`}>
                              <Button size="sm" variant="outline" className="flex-1">
                                View Profile
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

                  {/* Sent Requests Sub-tab */}
                  {networkSubTab === 'sent' && (
                <div>
                  {sentLoading ? (
                    <LoadingSkeleton variant="rectangular" />
                  ) : sentRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12 text-center">
                      <div className="bg-[#E6F7FC] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClockIcon className="w-10 h-10 text-[#0BC0DF]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No sent requests</h3>
                      <p className="text-gray-600 dark:text-gray-400">You haven't sent any connection requests recently.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sentRequests.map((request) => (
                        <div key={request.connectionId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                              {request.user.profileImage ? (
                                <Image
                                  src={request.user.profileImage}
                                  alt={request.user.name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold">
                                  {getUserInitials(request.user.name)}
                                </div>
                              )}
                            </div>
                            <div>
                              <Link
                                href={`/profile/${request.user._id}`}
                                className="font-semibold text-gray-900 dark:text-white hover:text-[#0BC0DF] transition-colors flex items-center space-x-1"
                              >
                                <span>{request.user.name}</span>
                                <VerificationBadge isVerified={request.user.isVerified} size="sm" />
                              </Link>
                              {request.user.headline && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {request.user.headline}
                                </p>
                              )}
                              {request.message && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                                  Your message: "{request.message}"
                                </p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Sent on {formatDate(request.requestedAt)}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleCancelRequest(request.connectionId)}
                            size="sm"
                            variant="outline"
                          >
                            Withdraw
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                  )}
                </>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}