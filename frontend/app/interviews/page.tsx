'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import {
  VideoCameraIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Interview {
  _id: string;
  domain: string;
  title: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  company?: {
    companyName: string;
  };
  job?: {
    title: string;
  };
  hrReview: {
    decision: string;
    rating?: number;
    comments?: string;
    meetingLink?: string;
    meetingDate?: string;
    meetingTime?: string;
  };
  questions: any[];
}

export default function InterviewsPage() {
  return (
    <ProtectedRoute>
      <InterviewsContent />
    </ProtectedRoute>
  );
}

function InterviewsContent() {
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterview();
  }, []);

  const fetchInterview = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Get the most recent interview that's not rejected or completed with rejection
        if (data.interviews && data.interviews.length > 0) {
          // Only show active interview (not rejected)
          const activeInterview = data.interviews.find(
            (i: Interview) => i.hrReview.decision !== 'rejected'
          );
          if (activeInterview) {
            console.log('Active interview:', activeInterview);
            console.log('HR Review:', activeInterview.hrReview);
            console.log('Meeting Link:', activeInterview.hrReview?.meetingLink);
            setInterview(activeInterview);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageStatus = () => {
    if (!interview) return 'none';
    if (interview.status === 'scheduled' || interview.status === 'in-progress') return 'ai';
    if (interview.status === 'completed' && interview.hrReview.decision === 'pending') return 'hr';
    // When shortlisted, user is still at HR Interview stage (waiting for or attending HR interview)
    if (interview.hrReview.decision === 'shortlisted') return 'hr';
    if (interview.hrReview.decision === 'rejected') return 'rejected';
    return 'placed';
  };

  const stage = getStageStatus();

  const stages = [
    {
      id: 'ai',
      name: 'AI Interview',
      description: 'Automated technical assessment',
      icon: VideoCameraIcon
    },
    {
      id: 'hr',
      name: 'HR Interview',
      description: 'Cenopie HR screening',
      icon: UserGroupIcon
    },
    {
      id: 'final',
      name: 'Final Round',
      description: 'On-site company interview',
      icon: BuildingOfficeIcon
    },
    {
      id: 'placed',
      name: 'Placed!',
      description: 'Congratulations!',
      icon: CheckCircleIcon
    }
  ];

  const currentStageIndex = stages.findIndex(s => s.id === stage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-8">
      <div className="w-full flex justify-center px-3 sm:px-4 py-4 sm:py-8">
        <div className="w-full lg:w-[1200px]">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Interviews
          </h1>
          
          {/* Beta Notice */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">β</span>
              </div>
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                Beta Version Access
              </h3>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300 text-center">
              You're currently accessing the interview section for free as part of our beta program. 
              This feature will be part of our premium subscription in the future.
            </p>
          </div>
          
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Choose your domain and start your journey to placement
          </p>
        </div>

        {/* Journey Progress Bar - Always visible at top */}
        <div className="bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-lg">
          <h3 className="text-white text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center">
            Your Journey to Placement
          </h3>
          
          {/* Mobile: Vertical Layout */}
          <div className="block sm:hidden space-y-4">
            {stages.map((stageItem, index) => {
              const Icon = stageItem.icon;
              const isActive = index === currentStageIndex;
              const isCompleted = index < currentStageIndex;
              const isRejected = stage === 'rejected' && index === 1;

              return (
                <div key={stageItem.id} className="flex items-center space-x-4">
                  {/* Icon Circle */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                      isActive
                        ? 'bg-white shadow-lg'
                        : isCompleted
                        ? 'bg-white/80'
                        : isRejected
                        ? 'bg-red-500'
                        : 'bg-white/30'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isActive || isCompleted
                          ? 'text-cyan-500'
                          : isRejected
                          ? 'text-white'
                          : 'text-white/50'
                      }`}
                    />
                  </div>
                  
                  {/* Stage Info */}
                  <div className="flex-1">
                    <div
                      className={`font-semibold text-sm ${
                        isActive || isCompleted ? 'text-white' : 'text-white/60'
                      }`}
                    >
                      {stageItem.name}
                    </div>
                    <div
                      className={`text-xs ${
                        isActive || isCompleted ? 'text-white/90' : 'text-white/50'
                      }`}
                    >
                      {stageItem.description}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    {isCompleted && (
                      <CheckCircleIcon className="w-5 h-5 text-white" />
                    )}
                    {isActive && (
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden sm:flex items-center justify-between max-w-4xl mx-auto">
            {stages.map((stageItem, index) => {
              const Icon = stageItem.icon;
              const isActive = index === currentStageIndex;
              const isCompleted = index < currentStageIndex;
              const isRejected = stage === 'rejected' && index === 1;

              return (
                <div key={stageItem.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    {/* Icon Circle */}
                    <div
                      className={`w-16 lg:w-20 h-16 lg:h-20 rounded-full flex items-center justify-center mb-3 transition-all ${
                        isActive
                          ? 'bg-white shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-white/80'
                          : isRejected
                          ? 'bg-red-500'
                          : 'bg-white/30'
                      }`}
                    >
                      <Icon
                        className={`w-8 lg:w-10 h-8 lg:h-10 ${
                          isActive || isCompleted
                            ? 'text-cyan-500'
                            : isRejected
                            ? 'text-white'
                            : 'text-white/50'
                        }`}
                      />
                    </div>
                    
                    {/* Stage Name */}
                    <div className="text-center">
                      <div
                        className={`font-semibold mb-1 text-sm lg:text-base ${
                          isActive || isCompleted ? 'text-white' : 'text-white/60'
                        }`}
                      >
                        {stageItem.name}
                      </div>
                      <div
                        className={`text-xs ${
                          isActive || isCompleted ? 'text-white/90' : 'text-white/50'
                        }`}
                      >
                        {stageItem.description}
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  {index < stages.length - 1 && (
                    <div className="flex items-center justify-center w-8 lg:w-12 mb-12">
                      <ArrowRightIcon
                        className={`w-6 lg:w-8 h-6 lg:h-8 ${
                          isCompleted ? 'text-white' : 'text-white/30'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        {!interview ? (
          // No interview - Show domain selection
          <DomainSelection />
        ) : (
          // Has interview - Show status
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
            {/* Interview Info */}
            <div className="mb-6 sm:mb-8 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {interview.title}
                </h2>
                {/* Delete button for testing/resetting */}
                {interview.status !== 'completed' && interview.hrReview.decision === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (confirm('Delete this interview and start fresh?')) {
                        try {
                          const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interview._id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          setInterview(null);
                        } catch (error) {
                          console.error('Delete error:', error);
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Reset
                  </Button>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {interview.domain}
                {interview.company && ` • ${interview.company.companyName}`}
                {interview.job && ` • ${interview.job.title}`}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">
                Started on {new Date(interview.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Status-based Content */}
            <div className="max-w-2xl mx-auto">
              {(interview.status === 'scheduled' || interview.status === 'in-progress') && (
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <VideoCameraIcon className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Ready to Start Your AI Interview
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 px-2">
                    You'll answer {interview.questions.length} technical questions. Make sure you have a quiet environment and working camera.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => router.push(`/interviews/${interview._id}/start`)}
                    className="w-full sm:w-auto"
                  >
                    <VideoCameraIcon className="w-5 h-5 mr-2" />
                    Start AI Interview
                  </Button>
                </div>
              )}

              {interview.status === 'completed' && interview.hrReview.decision === 'pending' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6 lg:p-8 text-center">
                  <ClockIcon className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    Interview Under Review
                  </h3>
                  <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200 mb-4 px-2">
                    Great job completing the AI interview! Our HR team is reviewing your responses and will get back to you shortly.
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                    Awaiting HR decision
                  </div>
                </div>
              )}

              {interview.hrReview.decision === 'shortlisted' && (
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 sm:p-6 lg:p-8 text-center">
                  <CheckCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-green-900 dark:text-green-100 mb-3">
                    🎉 Congratulations! You're Shortlisted
                  </h3>
                  <p className="text-sm sm:text-base text-green-800 dark:text-green-200 mb-4 px-2">
                    Excellent performance! You've been selected for an HR interview with the Cenopie team.
                  </p>
                  
                  {/* Meeting Details */}
                  {interview.hrReview.meetingLink && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        📅 Your HR Interview is Scheduled
                      </p>
                      
                      {/* Date and Time */}
                      {(interview.hrReview.meetingDate || interview.hrReview.meetingTime) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 mb-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm">
                            {interview.hrReview.meetingDate && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 dark:text-gray-400">📆 Date:</span>
                                <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                                  {new Date(interview.hrReview.meetingDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                            {interview.hrReview.meetingTime && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 dark:text-gray-400">🕐 Time:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {interview.hrReview.meetingTime}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <a
                        href={interview.hrReview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors w-full sm:w-auto justify-center"
                      >
                        <VideoCameraIcon className="w-5 h-5" />
                        Join HR Interview
                        <ArrowRightIcon className="w-4 h-4" />
                      </a>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 px-2">
                        Click the link above at the scheduled time to join your interview
                      </p>
                    </div>
                  )}
                  
                  {interview.hrReview.rating && (
                    <div className="flex items-center justify-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            star <= interview.hrReview.rating!
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}
                  {interview.hrReview.comments && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        HR Feedback:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        "{interview.hrReview.comments}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {interview.hrReview.decision === 'rejected' && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 lg:p-8 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl sm:text-3xl">😔</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-red-100 mb-3">
                    Not Selected This Time
                  </h3>
                  <p className="text-sm sm:text-base text-red-800 dark:text-red-200 mb-6 px-2">
                    Thank you for your interest and effort. Don't be discouraged - every interview is a learning opportunity. Keep improving and try again!
                  </p>
                  {interview.hrReview.comments && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 text-left mb-6">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Feedback:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        "{interview.hrReview.comments}"
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      setInterview(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto"
                  >
                    Start New Interview
                  </Button>
                </div>
              )}


            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function DomainSelection() {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <VideoCameraIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Your Domain
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          Select from 150+ domains across all fields. Start with our AI interview and progress through our placement process.
        </p>
      </div>

      {/* Redirect to New Interview Page */}
      <div className="text-center">
        <Button
          size="lg"
          onClick={() => router.push('/interviews/new')}
          className="w-full sm:w-auto min-w-[200px] bg-[#0BC0DF] hover:bg-[#0BC0DF]/90"
        >
          Choose Domain & Start Interview
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </Button>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Browse through comprehensive domain selection with search and filtering
        </p>
      </div>
    </div>
  );
}
