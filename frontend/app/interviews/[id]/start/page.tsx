'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import StrictInterviewMode from '@/components/StrictInterviewMode';

export default function InterviewStartPage() {
  return (
    <ProtectedRoute>
      <InterviewStartContent />
    </ProtectedRoute>
  );
}

function InterviewStartContent() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInterview = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInterview(data.interview);
      } else {
        router.push('/interviews');
      }
    } catch (error) {
      router.push('/interviews');
    } finally {
      setLoading(false);
    }
  }, [interviewId, router]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  const handleInterviewComplete = () => {
    // Redirect to interviews page after completion
    setTimeout(() => {
      router.push('/interviews');
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0BC0DF]"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Interview not found</p>
          <button 
            onClick={() => router.push('/interviews')}
            className="px-4 py-2 bg-[#0BC0DF] text-white rounded-lg hover:bg-[#0aa9c4] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <StrictInterviewMode
      interviewId={interviewId}
      interview={interview}
      onComplete={handleInterviewComplete}
    />
  );
}
