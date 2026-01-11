'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon
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
  fullRecordingUrl?: string;
  createdAt: string;
  completedAt?: string;
  totalDuration?: number;
  hrReview: {
    decision: string;
    rating?: number;
    comments?: string;
  };
}

export default function HRAdminReviewPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [decision, setDecision] = useState('pending');
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/hr-admin');
      return;
    }

    fetchInterview();
  }, [interviewId, router]);

  const fetchInterview = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hr-admin/interviews/${interviewId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Check if interview has valid user data
        if (!data.interview.user) {
          alert('Interview data is incomplete. The user may have been deleted.');
          router.push('/hr-admin/interviews');
          return;
        }
        
        setInterview(data.interview);
        setDecision(data.interview.hrReview.decision);
        setRating(data.interview.hrReview.rating || 0);
        setComments(data.interview.hrReview.comments || '');
        setMeetingLink(data.interview.hrReview.meetingLink || '');
        setMeetingDate(data.interview.hrReview.meetingDate || '');
        setMeetingTime(data.interview.hrReview.meetingTime || '');
      } else if (response.status === 401 || response.status === 403) {
        alert('HR access required. Please login as an HR user.');
        router.push('/hr-admin');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!decision || decision === 'pending') {
      alert('Please select a decision');
      return;
    }

    // Validate meeting details if shortlisted
    if (decision === 'shortlisted') {
      if (!meetingLink.trim()) {
        alert('Please provide a meeting link for shortlisted candidates');
        return;
      }
      if (!meetingDate) {
        alert('Please select a meeting date');
        return;
      }
      if (!meetingTime) {
        alert('Please select a meeting time');
        return;
      }
    }

    setReviewing(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hr-admin/interviews/${interviewId}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            decision,
            rating,
            comments,
            meetingLink: decision === 'shortlisted' ? meetingLink : undefined,
            meetingDate: decision === 'shortlisted' ? meetingDate : undefined,
            meetingTime: decision === 'shortlisted' ? meetingTime : undefined
          })
        }
      );

      if (response.ok) {
        // Refresh the interview data to show updated status
        await fetchInterview();
        alert('Interview reviewed successfully! You can update the review anytime.');
        // Stay on the same page - don't redirect
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to review interview');
      }
    } catch (error) {
      console.error('Error reviewing interview:', error);
      alert('Failed to review interview');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Interview not found
          </h2>
          <Button onClick={() => router.push('/hr-admin/interviews')}>
            Back to Interviews
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/hr-admin/interviews')}
            className="mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Interviews
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {interview.user?.name || 'Unknown User'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {interview.user?.email || 'No email available'} • {interview.domain}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Interview Recording
              </h2>
              
              {interview.fullRecordingUrl ? (
                <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
                  <video
                    src={interview.fullRecordingUrl}
                    controls
                    className="w-full h-full"
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No video recording available
                  </p>
                </div>
              )}

              {interview.totalDuration && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  Duration: {Math.floor(interview.totalDuration / 60)} minutes
                </p>
              )}
            </div>
          </div>

          {/* Review Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                HR Review
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Decision
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDecision('shortlisted')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        decision === 'shortlisted'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <CheckCircleIcon className="w-6 h-6 mx-auto mb-1 text-green-600" />
                      <span className="text-sm font-medium">Shortlist</span>
                    </button>
                    <button
                      onClick={() => setDecision('rejected')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        decision === 'rejected'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <XCircleIcon className="w-6 h-6 mx-auto mb-1 text-red-600" />
                      <span className="text-sm font-medium">Reject</span>
                    </button>
                    <button
                      onClick={() => setDecision('on-hold')}
                      className={`p-3 rounded-lg border-2 transition-colors col-span-2 ${
                        decision === 'on-hold'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <PauseCircleIcon className="w-6 h-6 mx-auto mb-1 text-yellow-600" />
                      <span className="text-sm font-medium">On Hold</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <StarIcon
                          className={`w-8 h-8 ${
                            star <= rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comments
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Add your review comments..."
                  />
                </div>

                {/* Meeting Details - Only show when shortlisted */}
                {decision === 'shortlisted' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                        HR Interview Meeting Link *
                      </label>
                      <input
                        type="url"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom link"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                          Interview Date *
                        </label>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                          Interview Time *
                        </label>
                        <input
                          type="time"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <p className="text-xs text-green-700 dark:text-green-300">
                      📅 The candidate will receive the meeting link with scheduled date and time
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleReview}
                  disabled={reviewing || !decision || decision === 'pending'}
                  className="w-full"
                >
                  {reviewing ? 'Saving...' : interview?.status === 'reviewed' ? 'Update Review' : 'Submit Review'}
                </Button>
                {interview?.status === 'reviewed' && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                    You can update the review details anytime
                  </p>
                )}
              </div>
            </div>

            {/* Interview Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Details
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {interview.status}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Created</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(interview.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {interview.completedAt && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Completed</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(interview.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
