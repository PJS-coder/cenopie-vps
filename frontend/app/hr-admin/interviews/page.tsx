'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  VideoCameraIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface Interview {
  _id: string;
  user: {
    name: string;
    email: string;
    profilePicture?: string;
  } | null;
  domain: string;
  status: string;
  hrReview: {
    decision: string;
  };
  createdAt: string;
  completedAt?: string;
}

export default function HRAdminInterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'shortlisted' | 'rejected'>('all');
  const [stats, setStats] = useState<any>(null);

  const fetchInterviews = useCallback(async () => {
    try {
      const hrToken = localStorage.getItem('authToken');
      const url = filter === 'all'
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/hr-admin/interviews`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/hr-admin/interviews?decision=${filter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${hrToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInterviews(data.interviews || []);
      } else if (response.status === 401 || response.status === 403) {
        // Use console.error instead of alert for better UX
        console.error('HR access required. Redirecting to login.');
        router.push('/hr-admin');
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  const fetchStats = useCallback(async () => {
    try {
      const hrToken = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hr-admin/interviews/stats`,
        {
          headers: {
            'Authorization': `Bearer ${hrToken}`
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
  }, []);

  useEffect(() => {
    // Check authentication - use regular auth token
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/hr-admin');
      return;
    }

    fetchInterviews();
    fetchStats();
  }, [fetchInterviews, fetchStats, router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/hr-admin');
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header Text */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Cenopie HR - Interview Review
          </h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
        <p className="text-gray-600 mb-8">
          Review and manage all candidate test interviews
        </p>
        {/* Simple Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{interviews.length}</div>
              <div className="text-sm text-gray-600">Total Interviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.decisionStats?.find((s: any) => s._id === 'pending')?.count || 0}
              </div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.decisionStats?.find((s: any) => s._id === 'shortlisted')?.count || 0}
              </div>
              <div className="text-sm text-gray-600">Shortlisted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.decisionStats?.find((s: any) => s._id === 'rejected')?.count || 0}
              </div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </div>
        )}

        {/* Simple Tabs */}
        <div className="flex gap-1 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm rounded ${
              filter === 'all'
                ? 'bg-cyan-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm rounded ${
              filter === 'pending'
                ? 'bg-cyan-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('shortlisted')}
            className={`px-4 py-2 text-sm rounded ${
              filter === 'shortlisted'
                ? 'bg-cyan-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Shortlisted
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 text-sm rounded ${
              filter === 'rejected'
                ? 'bg-cyan-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Simple Interview List */}
        {interviews.length === 0 ? (
          <div className="text-center py-12">
            <VideoCameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No interviews yet</h3>
            <p className="text-gray-500">Completed interviews will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {interviews
              .filter((interview) => interview.user !== null)
              .map((interview) => (
              <Link
                key={interview._id}
                href={`/hr-admin/interviews/${interview._id}`}
                className="block bg-white rounded p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {(interview.user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {interview.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {interview.domain} • {new Date(interview.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      interview.hrReview.decision === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : interview.hrReview.decision === 'shortlisted'
                        ? 'bg-green-100 text-green-700'
                        : interview.hrReview.decision === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {interview.hrReview.decision === 'pending' ? 'Pending' : 
                       interview.hrReview.decision === 'shortlisted' ? 'Shortlisted' :
                       interview.hrReview.decision === 'rejected' ? 'Rejected' : 
                       interview.hrReview.decision}
                    </span>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
