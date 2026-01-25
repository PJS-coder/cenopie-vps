'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

interface Interview {
  _id: string;
  domain: string;
  status: string;
  score?: number;
  aiAnalysis?: {
    overallFeedback: string;
    strengths: string[];
    improvements: string[];
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
  };
  questions: Array<{
    question: string;
    answer?: string;
  }>;
  createdAt: string;
  completedAt?: string;
  duration?: number;
}

export default function InterviewDetailsPage() {
  return (
    <ProtectedRoute>
      <InterviewDetailsContent />
    </ProtectedRoute>
  );
}

function InterviewDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterview();
  }, [interviewId]);

  const fetchInterview = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInterview(data.interview);
      } else {
        router.push('/interviews');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Interview not found</p>
          <Button onClick={() => router.push('/interviews')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-8">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/interviews')}
            className="mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Interviews
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {interview.domain} Interview
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4" />
              <span>{interview.questions.length} questions</span>
            </div>
          </div>
        </div>

        {interview.status === 'completed' && interview.aiAnalysis ? (
          <>
            {/* Score Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90 mb-1">Overall Score</div>
                  <div className="text-6xl font-bold mb-2">{interview.score}</div>
                  <div className="text-xl">{getScoreLabel(interview.score || 0)}</div>
                </div>
                <TrophyIcon className="w-24 h-24 opacity-20" />
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Technical</div>
                    <div className={`text-2xl font-bold ${getScoreColor(interview.aiAnalysis.technicalScore)}`}>
                      {interview.aiAnalysis.technicalScore}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Communication</div>
                    <div className={`text-2xl font-bold ${getScoreColor(interview.aiAnalysis.communicationScore)}`}>
                      {interview.aiAnalysis.communicationScore}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <TrophyIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                    <div className={`text-2xl font-bold ${getScoreColor(interview.aiAnalysis.confidenceScore)}`}>
                      {interview.aiAnalysis.confidenceScore}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Feedback */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                AI Feedback
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {interview.aiAnalysis.overallFeedback}
              </p>
            </div>

            {/* Strengths */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Strengths
                </h2>
              </div>
              <ul className="space-y-3">
                {interview.aiAnalysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <LightBulbIcon className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Areas for Improvement
                </h2>
              </div>
              <ul className="space-y-3">
                {interview.aiAnalysis.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-600 dark:text-yellow-400 text-sm font-bold">!</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              This interview is {interview.status}. Complete it to see your results and AI feedback.
            </p>
          </div>
        )}

        {/* Questions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Interview Questions
          </h2>
          <div className="space-y-4">
            {interview.questions.map((q, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Question {index + 1}
                </div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {q.question}
                </div>
                {q.answer && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Your answer:</span> {q.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/interviews')}
            className="flex-1"
          >
            Back to Interviews
          </Button>
          {interview.status !== 'completed' && (
            <Button
              onClick={() => router.push(`/interviews/${interviewId}/start`)}
              className="flex-1"
            >
              Continue Interview
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
