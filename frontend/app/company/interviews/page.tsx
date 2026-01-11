'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  VideoCameraIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface Interview {
  _id: string;
  user: {
    name: string;
    email: string;
    profilePicture?: string;
  } | null;
  job?: {
    title: string;
  };
  domain: string;
  status: string;
  hrReview: {
    decision: string;
  };
  createdAt: string;
  completedAt?: string;
  fullRecordingUrl?: string;
}

export default function CompanyInterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'shortlisted' | 'rejected'>('all');
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchInterviews();
    fetchStats();
  }, [filter]);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('companyAuthToken');
      
      if (!token) {
        setError('Not authenticated. Please login as a company.');
        setLoading(false);
        return;
      }

      const url = filter === 'all'
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/company/interviews`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/company/interviews?decision=${filter}`;

      console.log('Fetching interviews from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Interviews data:', data);
        setInterviews(data.interviews || []);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setError(errorData.error || 'Failed to fetch interviews');
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setError('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('companyAuthToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/company/interviews/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getDecisionBadge = (decision: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      'on-hold': 'bg-gray-100 text-gray-800'
    };
    return badges[decision as keyof typeof badges] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error}
          </h2>
          <Button onClick={() => router.push('/company/auth/login')}>
            Login as Company
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Candidate Test Interviews
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review completed test interviews from all candidates
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Interviews</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {interviews.length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Review</div>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.decisionStats?.find((s: any) => s._id === 'pending')?.count || 0}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Shortlisted</div>
              <div className="text-3xl font-bold text-green-600">
                {stats.decisionStats?.find((s: any) => s._id === 'shortlisted')?.count || 0}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rejected</div>
              <div className="text-3xl font-bold text-red-600">
                {stats.decisionStats?.find((s: any) => s._id === 'rejected')?.count || 0}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Pending Review
          </Button>
          <Button
            variant={filter === 'shortlisted' ? 'default' : 'outline'}
            onClick={() => setFilter('shortlisted')}
            size="sm"
          >
            Shortlisted
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
            size="sm"
          >
            Rejected
          </Button>
        </div>

        {/* Interviews List */}
        {interviews.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
            <VideoCameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No interviews yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Interviews will appear here once candidates complete them
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {interviews
              .filter((interview) => interview.user !== null) // Filter out interviews with null user data
              .map((interview) => (
              <Link
                key={interview._id}
                href={`/company/interviews/${interview._id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Candidate Avatar */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      {interview.user?.profilePicture ? (
                        <img
                          src={interview.user.profilePicture}
                          alt={interview.user.name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>

                    {/* Interview Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {interview.user?.name || 'Unknown User'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDecisionBadge(interview.hrReview.decision)}`}>
                          {interview.hrReview.decision}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {interview.user?.email || 'No email available'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <VideoCameraIcon className="w-4 h-4" />
                          <span>{interview.domain}</span>
                        </div>
                        {interview.job && (
                          <div className="flex items-center gap-1">
                            <span>{interview.job.title}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button size="sm" variant="outline">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Review
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
