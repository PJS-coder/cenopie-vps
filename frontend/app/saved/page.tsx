"use client";
import { useState, useEffect } from 'react';
import { BookmarkIcon, ArrowLeftIcon, BriefcaseIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PostCard from '@/components/PostCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProfileSidebar from '@/components/ProfileSidebar';
import PeopleYouMayKnow from '@/components/PeopleYouMayKnow';
import { useRouter } from 'next/navigation';
import { FeedPost } from '@/hooks/useFeed';
import { jobApi } from '@/lib/api';
import VerificationBadge from '@/components/VerificationBadge';
import { useToastContext } from '@/components/ToastProvider';

interface SavedPost extends FeedPost {
  savedAt: string;
}

interface SavedJob {
  id: string;
  savedAt: string;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    type: string;
    experience?: string;
    salary?: string;
    createdAt: string;
    company: {
      id: string;
      name: string;
      logo?: string;
      isVerified: boolean;
    };
  };
}

type TabType = 'posts' | 'jobs';

export default function SavedItemsPage() {
  const router = useRouter();
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const getCurrentUserId = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return currentUser._id || currentUser.id;
    } catch (error) {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Get saved posts from localStorage
  const getSavedPostsFromStorage = (): SavedPost[] => {
    try {
      const savedPosts = localStorage.getItem('savedPosts');
      if (savedPosts) {
        return JSON.parse(savedPosts);
      }
      return [];
    } catch (error) {
      console.error('Error getting saved posts from localStorage:', error);
      return [];
    }
  };

  useEffect(() => {
    // Get current user
    const getCurrentUser = () => {
      try {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    // Fetch saved posts from localStorage
    const fetchSavedPosts = async () => {
      try {
        // Get saved posts from localStorage
        const savedPostsData = getSavedPostsFromStorage();
        setSavedPosts(savedPostsData);
      } catch (error) {
        console.error('Error fetching saved posts:', error);
      }
    };

    // Fetch saved jobs from API
    const fetchSavedJobs = async () => {
      try {
        const response = await jobApi.getSavedJobs();
        const savedJobsData = response.data?.savedJobs || response.savedJobs || [];
        setSavedJobs(Array.isArray(savedJobsData) ? savedJobsData : []);
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      getCurrentUser();
      await Promise.all([fetchSavedPosts(), fetchSavedJobs()]);
      setLoading(false);
    };

    fetchData();

    // Listen for saved posts updates
    const handleSavedPostsUpdate = () => {
      fetchSavedPosts();
    };

    window.addEventListener('savedPostsUpdated', handleSavedPostsUpdate);

    return () => {
      window.removeEventListener('savedPostsUpdated', handleSavedPostsUpdate);
    };
  }, []);

  const handleUnsave = async (postId: string) => {
    try {
      console.log('Unsaving post:', postId);
      
      // Get existing saved posts from localStorage
      const existingSavedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
      
      // Remove the post from saved posts
      const updatedSavedPosts = existingSavedPosts.filter((savedPost: any) => savedPost.id !== postId);
      localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
      
      // Update local state
      setSavedPosts(prev => prev.filter(post => post.id !== postId));
      
      // Dispatch event to update other components
      window.dispatchEvent(new Event('savedPostsUpdated'));
      
      // Show success message
      toast.success('Post removed from saved items');
    } catch (error) {
      console.error('Error unsaving post:', error);
      toast.error('Failed to remove post from saved items');
    }
  };

  const handleLike = async (postId: string) => {
    // Like functionality would be implemented here
    console.log('Liking post:', postId);
  };

  const handleComment = async (postId: string, commentText?: string) => {
    // Comment functionality would be implemented here
    console.log('Commenting on post:', postId, commentText);
  };

  const handleShare = (postId: string) => {
    // Share functionality would be implemented here
    console.log('Sharing post:', postId);
    toast.info(`Share functionality coming soon!`);
  };

  const handleRepost = async (postId: string, repostComment?: string) => {
    // Repost functionality would be implemented here
    console.log('Reposting:', postId, repostComment);
  };

  const handleUnsaveJob = async (jobId: string) => {
    try {
      console.log('Unsaving job:', jobId);
      
      const response = await jobApi.saveJob(jobId);
      
      // Remove the job from saved jobs
      setSavedJobs(prev => prev.filter(savedJob => savedJob.job.id !== jobId));
      
      // Silent success - just update the UI
    } catch (error) {
      console.error('Error unsaving job:', error);
      // Show user-friendly message without technical details
      toast.error('Unable to remove job at the moment. Please try again.');
    }
  };

  const formatSavedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatJobDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full flex justify-center px-4 lg:px-6">
          <div className="w-full lg:w-[1200px] py-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Center Content Area */}
              <div className="lg:col-span-3">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-10 w-10"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <BookmarkSolidIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Items</h1>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {activeTab === 'posts' 
                          ? `${savedPosts.length} saved post${savedPosts.length !== 1 ? 's' : ''}`
                          : `${savedJobs.length} saved job${savedJobs.length !== 1 ? 's' : ''}`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                          activeTab === 'posts'
                            ? 'bg-[#0BC0DF] text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        Posts ({savedPosts.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('jobs')}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                          activeTab === 'jobs'
                            ? 'bg-[#0BC0DF] text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <BriefcaseIcon className="w-4 h-4" />
                        Jobs ({savedJobs.length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    {/* Posts Tab */}
                    {activeTab === 'posts' && (
                      <>
                        {savedPosts.length === 0 ? (
                          <Card className="text-center py-12">
                            <CardContent>
                              <ChatBubbleLeftIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No saved posts yet
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Save posts you want to read later by clicking the bookmark icon
                              </p>
                              <Button onClick={() => router.push('/feed')}>
                                Explore Feed
                              </Button>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="space-y-6">
                            {savedPosts.map((post) => (
                              <div key={post.id} className="relative">
                                {/* Saved date indicator */}
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  <BookmarkSolidIcon className="h-3 w-3 text-blue-600" />
                                  <span>Saved on {formatSavedDate(post.savedAt)}</span>
                                </div>
                                
                                <PostCard
                                  id={post.id}
                                  author={post.author}
                                  role={post.role}
                                  content={post.content}
                                  likes={post.likes}
                                  comments={post.comments}
                                  shares={post.shares}
                                  timestamp={post.timestamp}
                                  image={post.image}
                                  mediaType={post.mediaType}
                                  currentUserId={currentUser?._id || currentUser?.id}
                                  postAuthorId={post.authorId}
                                  profileImage={post.profileImage}
                                  onLike={handleLike}
                                  onComment={handleComment}
                                  onShare={handleShare}
                                  onRepost={handleRepost}
                                  onSave={handleUnsave} // This will unsave the post
                                  isLiked={post.isLiked}
                                  isSaved={true} // Always true for saved items page
                                  isRepost={false}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* Jobs Tab */}
                    {activeTab === 'jobs' && (
                      <>
                        {savedJobs.length === 0 ? (
                          <Card className="text-center py-12">
                            <CardContent>
                              <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No saved jobs yet
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Save jobs you're interested in by clicking the save button
                              </p>
                              <Button onClick={() => router.push('/jobs')}>
                                Browse Jobs
                              </Button>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="space-y-4">
                            {savedJobs.map((savedJob) => (
                              <div key={savedJob.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                {/* Saved date indicator */}
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                  <BookmarkSolidIcon className="h-3 w-3 text-blue-600" />
                                  <span>Saved on {formatSavedDate(savedJob.savedAt)}</span>
                                </div>

                                <div className="flex items-start gap-4">
                                  {/* Company Logo */}
                                  <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {savedJob.job.company?.logo ? (
                                      <img
                                        src={savedJob.job.company.logo}
                                        alt={savedJob.job.company.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <BriefcaseIcon className="w-6 h-6 text-gray-400" />
                                    )}
                                  </div>

                                  {/* Job Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-sm font-medium text-gray-600">{savedJob.job.company?.name || 'Unknown Company'}</h4>
                                      <VerificationBadge isVerified={savedJob.job.company?.isVerified || false} size="sm" />
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-xs text-gray-400">{formatJobDate(savedJob.job.createdAt)}</span>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 cursor-pointer hover:text-[#0BC0DF]" 
                                        onClick={() => router.push(`/jobs/${savedJob.job.id}`)}>
                                      {savedJob.job.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <span className="px-2.5 py-1 bg-[#E6F7FC] text-[#0BC0DF] rounded-full text-xs font-semibold">
                                        {savedJob.job.type}
                                      </span>
                                      {savedJob.job.experience && (
                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                                          {savedJob.job.experience}
                                        </span>
                                      )}
                                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                                        {savedJob.job.location}
                                      </span>
                                    </div>

                                    {savedJob.job.salary && (
                                      <div className="text-sm font-bold text-gray-900 mb-3">
                                        {savedJob.job.salary}
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      onClick={() => router.push(`/jobs/${savedJob.job.id}`)}
                                      className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white"
                                    >
                                      View Job
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUnsaveJob(savedJob.job.id)}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Left Sidebar - Profile Card */}
              <div className="lg:col-span-1 lg:order-first">
                <div className="lg:mt-[72px]"> {/* Offset to align with content */}
                  <ProfileSidebar userId={currentUserId || ''} currentUserId={currentUserId} />
                </div>
              </div>

              {/* Right Sidebar - People You May Know */}
              <div className="lg:col-span-1">
                <div className="lg:mt-[72px]"> {/* Offset to align with content */}
                  <PeopleYouMayKnow currentUserId={currentUserId} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
