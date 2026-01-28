'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeftIcon, 
  NewspaperIcon,
  BookmarkIcon,
  BriefcaseIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import StreamingFeedLoader from '@/components/StreamingFeedLoader';
import VerificationBadge from '@/components/VerificationBadge';
import ConnectButton from '@/components/ConnectButton';
import { newsApi, profileApi } from '@/lib/api';
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers';
import { useConnections } from '@/hooks/useConnections';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image?: string;
  publishedAt: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    isVerified: boolean;
  };
  timeAgo: string;
}

interface CurrentUser {
  id?: string;
  _id?: string;
  name?: string;
  role?: string;
  company?: string;
  college?: string;
  connections?: number;
  profileViews?: number;
  profileImage?: string;
  bannerImage?: string;
  headline?: string;
  bio?: string;
  followers?: string[];
  isVerified?: boolean;
}

export default function NewsArticlePage() {
  const router = useRouter();
  const params = useParams();
  const newsId = params.id as string;
  
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  
  const { users: suggestedUsers, loading: suggestedUsersLoading } = useSuggestedUsers();
  const { connections, loading: connectionsLoading } = useConnections();

  // Quick actions data
  const quickActions = [
    {
      icon: BriefcaseIcon,
      label: 'Find Jobs',
      description: 'Discover new opportunities',
      color: 'text-blue-600 bg-blue-50',
      action: () => router.push('/jobs')
    },
    {
      icon: UserGroupIcon,
      label: 'Network',
      description: 'Connect with professionals',
      color: 'text-purple-600 bg-purple-50',
      action: () => router.push('/network')
    },
    {
      icon: NewspaperIcon,
      label: 'All News',
      description: 'Browse all articles',
      color: 'text-green-600 bg-green-50',
      action: () => router.push('/news')
    },
    {
      icon: SparklesIcon,
      label: 'Showcase',
      description: 'View top profiles',
      color: 'text-yellow-600 bg-yellow-50',
      action: () => router.push('/showcase')
    }
  ];

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await profileApi.getProfile();
        const userData = response.data?.user || (response as any).user;
        
        if (userData) {
          const company = userData.experience?.find((exp: any) => exp.current)?.company || 
                         userData.experience?.[0]?.company;
          const college = userData.education?.find((edu: any) => edu.current)?.college || 
                         userData.education?.[0]?.college;
          
          const transformedUser: CurrentUser = {
            id: userData.id || userData._id,
            _id: userData._id || userData.id,
            name: userData.name,
            role: userData.headline || 'Professional',
            company: company,
            college: college,
            connections: userData.followers?.length || 0,
            profileViews: userData.profileViews || 0,
            profileImage: userData.profileImage,
            bannerImage: userData.bannerImage,
            headline: userData.headline,
            bio: userData.bio,
            followers: userData.followers,
            isVerified: userData.isVerified
          };
          
          setCurrentUser(transformedUser);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch news article
  useEffect(() => {
    const fetchArticle = async () => {
      if (!newsId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await newsApi.getNewsById(newsId);
        
        if (response.data?.news) {
          setArticle(response.data.news);
        } else {
          setError('Article not found');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [newsId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6"><StreamingFeedLoader count={1} /></div>;
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <NewspaperIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested article could not be found.'}</p>
          <div className="space-x-4">
            <button
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/news')}
              className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-6 py-2 rounded-lg transition-colors"
            >
              Browse News
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full flex justify-center px-4 lg:px-6 pb-8 pt-6">
        <div className="w-full lg:w-[1200px]">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left Sidebar - Profile & Quick Actions */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="lg:sticky lg:top-[72px] space-y-6">
                {/* User Profile Banner Card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  {/* Banner Image */}
                  <div 
                    className="relative h-24 w-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const userId = currentUser?.id || currentUser?._id;
                      if (userId) {
                        router.push(`/profile/${userId}`);
                      } else {
                        router.push('/profile');
                      }
                    }}
                    title="View your profile"
                  >
                    {currentUser?.bannerImage ? (
                      <Image 
                        src={currentUser.bannerImage} 
                        alt="Profile banner" 
                        className="w-full h-full object-cover"
                        fill
                        sizes="100vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                    )}
                    {/* Profile Image - centered horizontally */}
                    <div 
                      className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 cursor-pointer hover:scale-105 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        const userId = currentUser?.id || currentUser?._id;
                        if (userId) {
                          router.push(`/profile/${userId}`);
                        } else {
                          router.push('/profile');
                        }
                      }}
                      title="View your profile"
                    >
                      {currentUser?.profileImage ? (
                        <Image 
                          src={currentUser.profileImage} 
                          alt={currentUser.name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                          width={80}
                          height={80}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#E6F7FC] dark:bg-[#0a4d5c] flex items-center justify-center text-[#0BC0DF] font-semibold">
                          {getUserInitials(currentUser?.name || 'User')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Profile Content */}
                  <div className="p-5 pt-10">
                    <div className="flex flex-col items-center text-center">
                      <h4 
                        className="font-semibold text-gray-900 dark:text-white flex items-center justify-center space-x-2 cursor-pointer hover:text-[#0BC0DF] transition-colors"
                        onClick={() => {
                          const userId = currentUser?.id || currentUser?._id;
                          if (userId) {
                            router.push(`/profile/${userId}`);
                          } else {
                            router.push('/profile');
                          }
                        }}
                        title="View your profile"
                      >
                        <span>{currentUser?.name || 'User'}</span>
                        <VerificationBadge isVerified={currentUser?.isVerified} size="md" />
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{currentUser?.role || 'Professional'}</p>
                      {(() => {
                        const displayText = currentUser?.company || currentUser?.college;
                        return displayText ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{displayText}</p>
                        ) : null;
                      })()}
                      {currentUser?.bio && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-3">{currentUser.bio}</p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div 
                        className="flex justify-between text-sm mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 -mx-2 px-2 py-1 rounded transition-colors"
                        onClick={() => router.push('/notifications?tab=network')}
                      >
                        <span className="text-gray-500 dark:text-gray-400">Connections</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {connectionsLoading ? '...' : connections.length.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                      >
                        <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                          <action.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{action.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{action.description}</div>
                        </div>
                      </button>
                    ))}
                    
                    <button 
                      onClick={() => router.push('/saved')}
                      className="w-full flex items-center gap-3 px-3 py-3 text-sm text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <BookmarkIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">Saved Items</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Your bookmarked content</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Content - News Article */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              {/* Back Button */}
              <div className="mb-6">
                <button
                  onClick={() => router.back()}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  <span>Back</span>
                </button>
              </div>

              {/* Article */}
              <article className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {article.image && (
                  <div className="aspect-video w-full">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-8">
                  {/* Company Info */}
                  <div className="flex items-center space-x-4 mb-6">
                    {article.company.logo && (
                      <img
                        src={article.company.logo}
                        alt={article.company.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 text-lg">{article.company.name}</h4>
                        <VerificationBadge isVerified={article.company.isVerified} size="md" />
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(article.publishedAt)}</p>
                    </div>
                  </div>

                  {/* Article Content */}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">{article.title}</h1>
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
                      {article.content}
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Right Sidebar - People You May Know */}
            <div className="lg:col-span-1 order-3 lg:order-3">
              <div className="lg:sticky lg:top-[72px] space-y-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">People You May Know</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {suggestedUsersLoading ? (
                      <div className="p-4 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : suggestedUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No suggestions available
                      </div>
                    ) : (
                      suggestedUsers.slice(0, 5).map((person: any, index: number) => (
                        <div 
                          key={`${person.id}-${index}`} 
                          className="p-4 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => router.push(`/profile/${person.id}`)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-sm overflow-hidden">
                              {person.profileImage ? (
                                <Image 
                                  src={person.profileImage} 
                                  alt={person.name} 
                                  width={40} 
                                  height={40} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{person.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-gray-900 dark:text-white truncate flex items-center space-x-1">
                                <span>{person.name}</span>
                                <VerificationBadge isVerified={person.isVerified} size="sm" />
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {person.role} {person.company && `• ${person.company}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <button 
                      onClick={() => router.push('/network')}
                      className="w-full text-sm font-medium text-[#0BC0DF] hover:text-[#0aa9c4] transition-colors"
                    >
                      See all
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}