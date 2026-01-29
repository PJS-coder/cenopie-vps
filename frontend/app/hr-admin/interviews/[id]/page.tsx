'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  securityViolations?: string[];
  violationCount?: number;
  forcedSubmission?: boolean;
  submissionReason?: string;
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
        setInterview(data.interview);
        setDecision(data.interview.hrReview.decision);
        setRating(data.interview.hrReview.rating || 0);
        setComments(data.interview.hrReview.comments || '');
        setMeetingLink(data.interview.hrReview.meetingLink || '');
        setMeetingDate(data.interview.hrReview.meetingDate || '');
        setMeetingTime(data.interview.hrReview.meetingTime || '');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    // Validate required fields
    if (!decision || decision === 'pending') {
      return;
    }

    if (!rating || rating === 0) {
      return;
    }

    if (!comments.trim()) {
      return;
    }

    // Validate meeting details for shortlisted candidates
    if (decision === 'shortlisted') {
      if (!meetingLink.trim()) {
        return;
      }
      if (!meetingDate) {
        return;
      }
      if (!meetingTime) {
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
        await fetchInterview();
      } else {
        const data = await response.json();
      }
    } catch (err) {
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/hr-admin/interviews')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Interviews
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Interview Review</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Info Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {interview.user?.name || 'Unknown Candidate'}
              </h2>
              <p className="text-gray-600">
                {interview.user?.email || 'No email available'}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>Domain: <span className="font-medium text-gray-900">{interview.domain}</span></div>
              <div>Submitted: {new Date(interview.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Interview Info Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-gray-500">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  interview.status === 'completed' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {interview.status === 'completed' ? 'Pending Review' : 'Reviewed'}
                </span>
              </div>
              {interview.totalDuration && (
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {Math.floor(interview.totalDuration / 60)}:{(interview.totalDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Recording</h2>
              {interview.fullRecordingUrl ? (
                interview.fullRecordingUrl.includes('mock-video') ? (
                  // Show placeholder for mock videos in development
                  <div className="bg-gray-900 rounded-lg p-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a2 2 0 012-2h8a2 2 0 012 2v2M5 18h14a2 2 0 002-2v-8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-white text-lg font-medium mb-2">Development Mode</p>
                    <p className="text-gray-400 text-sm mb-4">Video uploaded successfully but not stored in development</p>
                    <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg inline-block">
                      ✅ Upload completed: {interview.fullRecordingUrl.split('/').pop()}
                    </div>
                  </div>
                ) : (
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      src={interview.fullRecordingUrl}
                      controls
                      className="w-full h-auto"
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>
                )
              ) : (
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No video recording available</p>
                </div>
              )}
            </div>
          </div>

          {/* Review Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">HR Assessment</h2>
              
              {/* Decision */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision <span className="text-red-500">*</span>
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="pending">Select Decision</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (1-5) <span className="text-red-500">*</span>
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={0}>Select Rating</option>
                  <option value={1}>1 - Poor</option>
                  <option value={2}>2 - Below Average</option>
                  <option value={3}>3 - Average</option>
                  <option value={4}>4 - Good</option>
                  <option value={5}>5 - Excellent</option>
                </select>
              </div>

              {/* Comments */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Add your review comments..."
                  required
                />
              </div>

              {/* Meeting Details for Shortlisted */}
              {decision === 'shortlisted' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Schedule Interview</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-blue-700 mb-1">Meeting Link</label>
                      <input
                        type="url"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-blue-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-blue-700 mb-1">Time</label>
                        <input
                          type="time"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleReview}
                disabled={reviewing || !decision || decision === 'pending' || !rating || rating === 0 || !comments.trim()}
                className="w-full"
                size="lg"
              >
                {reviewing ? 'Saving...' : interview?.status === 'reviewed' ? 'Update Review' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}