"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserGroupIcon, UserPlusIcon, ClockIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import ConnectButton from '@/components/ConnectButton';
import VerificationBadge from '@/components/VerificationBadge';
import { useConnections, useConnectionRequests } from '@/hooks/useConnections';
import { profileApi } from '@/lib/api';
import OptimizedLoader from '@/components/OptimizedLoader';

interface CurrentUser {
  _id: string;
  name: string;
  profileImage?: string;
}

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'sent'>('connections');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { connections, loading: connectionsLoading, error: connectionsError } = useConnections();
  const { requests: receivedRequests, loading: receivedLoading, acceptRequest, declineRequest } = useConnectionRequests('received');
  const { requests: sentRequests, loading: sentLoading, cancelRequest } = useConnectionRequests('sent');

  // Set mounted state immediately
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Check if we have user data in localStorage first for faster loading
        const cachedUser = localStorage.getItem('currentUser');
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          setCurrentUser({
            _id: userData._id || userData.id,
            name: userData.name,
            profileImage: userData.profileImage
          });
          setInitialLoading(false);
          return;
        }

        // If no cached data, fetch from API
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
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

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

  // Show loading immediately when component mounts or when initial loading
  if (!mounted || initialLoading || (connectionsLoading && connections.length === 0)) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Show Cenopie loader first */}
          <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
              {/* Brand Logo */}
              <div className="flex items-center space-x-1">
                <div className="text-2xl font-light text-[#0CC0DF] tracking-tight">Ceno</div>
                <div className="bg-[#0CC0DF] text-white px-2 py-1 rounded-lg text-sm font-bold">pie</div>
              </div>
              
              {/* Spinner */}
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0CC0DF]/20 border-t-[#0CC0DF]" />
              
              {/* Loading Text */}
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading your network...</p>
            </div>
          </div>

          <div className="w-full px-4 lg:px-6 py-8 flex justify-center">
            {/* Center content area with responsive width */}
            <div className="w-full lg:w-[1000px]">
              {/* Header Skeleton */}
              <div className="mb-8 animate-pulse">
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
              </div>

              {/* Tabs Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="py-4 px-1 animate-pulse">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Content Skeleton */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 animate-pulse">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded flex-1"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded flex-1"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full px-4 lg:px-6 py-8 flex justify-center">
          {/* Center content area with responsive width */}
          <div className="w-full lg:w-[1000px]">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Network</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your professional connections</p>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('connections')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'connections'
                      ? 'border-[#0BC0DF] text-[#0BC0DF]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <UserGroupIcon className="w-5 h-5 inline mr-2" />
                  Connections ({connections.length})
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'requests'
                      ? 'border-[#0BC0DF] text-[#0BC0DF]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <UserPlusIcon className="w-5 h-5 inline mr-2" />
                  Requests ({receivedRequests.length})
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'sent'
                      ? 'border-[#0BC0DF] text-[#0BC0DF]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <ClockIcon className="w-5 h-5 inline mr-2" />
                  Sent ({sentRequests.length})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Connections Tab */}
              {activeTab === 'connections' && (
                <div>
                  {connectionsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 animate-pulse">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded flex-1"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded flex-1"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : connectionsError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500">{connectionsError}</p>
                    </div>
                  ) : connections.length === 0 ? (
                    <div className="text-center py-12">
                      <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No connections yet</h3>
                      <p className="text-gray-500 dark:text-gray-400">Start building your professional network by connecting with colleagues and industry professionals.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {connections.map((connection) => (
                        <div key={connection.connectionId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
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
                            <Link href={`/messages?user=${connection.user._id}`}>
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

              {/* Received Requests Tab */}
              {activeTab === 'requests' && (
                <div>
                  {receivedLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex items-center justify-between animate-pulse">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                            <div className="space-y-2">
                              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
                            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : receivedRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <UserPlusIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pending requests</h3>
                      <p className="text-gray-500 dark:text-gray-400">You don't have any connection requests at the moment.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {receivedRequests.map((request) => (
                        <div key={request.connectionId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
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
                                  "{request.message}"
                                </p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
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

              {/* Sent Requests Tab */}
              {activeTab === 'sent' && (
                <div>
                  {sentLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex items-center justify-between animate-pulse">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                            <div className="space-y-2">
                              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : sentRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sent requests</h3>
                      <p className="text-gray-500 dark:text-gray-400">You haven't sent any connection requests recently.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sentRequests.map((request) => (
                        <div key={request.connectionId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
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
            </div>
          </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
