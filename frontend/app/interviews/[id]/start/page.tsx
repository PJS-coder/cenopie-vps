'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import {
  VideoCameraIcon,
  MicrophoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

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

  const [step, setStep] = useState<'setup' | 'interview' | 'complete'>('setup');
  const [interview, setInterview] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  
  // Media
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    fetchInterview();
  }, [interviewId]);

  // Prevent navigation during interview
  useEffect(() => {
    if (!isInterviewStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step === 'interview' && !isSubmittingRef.current) {
        e.preventDefault();
        e.returnValue = 'Your interview is in progress. If you leave now, it will be automatically submitted.';
        
        // Auto-submit the interview
        setTimeout(() => {
          if (!isSubmittingRef.current) {
            console.log('Auto-submitting interview due to navigation attempt');
            completeInterview();
          }
        }, 100);
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (step === 'interview' && !isSubmittingRef.current) {
        e.preventDefault();
        console.log('Back button pressed during interview - auto-submitting');
        completeInterview();
        return false;
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Push a dummy state to prevent back navigation
    if (step === 'interview') {
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isInterviewStarted, step]);

  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('Setting video stream to video element');
      videoRef.current.srcObject = stream;
      // Ensure video plays
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    }
  }, [stream, step]); // Re-attach when step changes

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const fetchInterview = async () => {
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
        alert('Interview not found');
        router.push('/interviews');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      alert('Failed to load interview');
      router.push('/interviews');
    }
  };

  const requestPermissions = async () => {
    try {
      console.log('Requesting camera and microphone permissions...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },  // Low quality - 640x480
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          sampleRate: 16000  // Lower audio quality
        }
      });

      console.log('Permissions granted! Stream tracks:', mediaStream.getTracks().length);
      setStream(mediaStream);
      setHasPermissions(true);
    } catch (error) {
      console.error('Permission error:', error);
      alert('Camera and microphone access required. Please enable in browser settings.');
    }
  };

  const handleStartInterview = async () => {
    if (!hasPermissions || !stream) {
      alert('Please grant camera and microphone permissions');
      return;
    }

    // Verify stream is still active
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack || !videoTrack.enabled) {
      alert('Camera is not active. Please refresh and grant permissions again.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/start`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      console.log('Interview started, moving to interview step');
      setIsInterviewStarted(true);
      setStep('interview');
      startRecording();
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview');
    }
  };

  const startRecording = () => {
    if (!stream) return;

    try {
      chunksRef.current = [];
      
      // Use lower quality codec settings
      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',  // VP8 is more compressed than VP9
        videoBitsPerSecond: 250000  // 250kbps - very low quality, small file size
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Record in chunks every 10 seconds to avoid memory issues
      mediaRecorder.start(10000);
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      alert('Failed to start recording');
    }
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(new Blob());
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
    });
  };

  const uploadVideo = async (videoBlob: Blob): Promise<string> => {
    try {
      console.log('Video blob size:', videoBlob.size, 'bytes');
      
      if (videoBlob.size === 0) {
        console.error('Video blob is empty!');
        alert('Recording failed - no video data captured');
        return '';
      }

      const formData = new FormData();
      formData.append('video', videoBlob, `interview-${interviewId}.webm`);

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      console.log('Uploading to:', `${process.env.NEXT_PUBLIC_API_URL}/api/upload/interview-video`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/interview-video`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      console.log('Upload response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Upload successful! URL:', data.url);
        return data.url;
      } else {
        let errorMessage = `Upload failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Upload failed:', errorData);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // Response wasn't JSON
          const textError = await response.text();
          console.error('Upload failed (non-JSON):', textError);
          errorMessage = textError || errorMessage;
        }
        alert('Video upload failed: ' + errorMessage);
      }
      return '';
    } catch (error) {
      console.error('Upload error:', error);
      alert('Video upload error: ' + error);
      return '';
    }
  };

  const handleNextQuestion = async () => {
    // Just move to next question, keep recording
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question - complete interview
      await completeInterview();
    }
  };

  const completeInterview = async () => {
    if (isSubmittingRef.current) {
      console.log('Interview already being submitted, skipping...');
      return;
    }
    
    isSubmittingRef.current = true;
    
    try {
      setIsUploading(true);
      
      // Stop recording and get the full video
      console.log('Stopping recording...');
      const videoBlob = await stopRecording();
      console.log('Recording stopped. Blob size:', videoBlob.size);
      
      const totalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      console.log('Total duration:', totalDuration, 'seconds');
      
      let videoUrl = '';
      
      // Only upload if we have video data
      if (videoBlob && videoBlob.size > 0) {
        console.log('Uploading complete interview video...');
        videoUrl = await uploadVideo(videoBlob);
        console.log('Video URL received:', videoUrl);
      } else {
        console.warn('No video data to upload!');
      }

      // For testing: Use mock URL if upload failed
      if (!videoUrl) {
        videoUrl = `https://res.cloudinary.com/dutmqmbhm/video/upload/v1/interview-videos/mock-${interviewId}.mp4`;
        console.log('Using mock URL:', videoUrl);
      }

      // Complete the interview with video URL
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      console.log('Completing interview with data:', {
        totalDuration,
        videoUrl
      });
      
      const completeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            totalDuration,
            videoUrl
          })
        }
      );

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        console.error('Complete interview error:', errorData);
        throw new Error(errorData.error || 'Failed to complete interview');
      }

      const completeData = await completeResponse.json();
      console.log('Interview completed successfully!', completeData);
      
      setStep('complete');
      setIsUploading(false);
      
      // Stop stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Redirect to main interviews page
      setTimeout(() => {
        router.push('/interviews');
      }, 3000);
    } catch (error) {
      console.error('Error completing interview:', error);
      alert('Failed to complete interview: ' + error);
      setIsUploading(false);
      isSubmittingRef.current = false; // Reset on error
    }
  };

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Setup view
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Interview Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            {interview.domain} • {interview.questions.length} Questions
          </p>

          {/* Important Notice */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  Important Notice
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Once you start the interview, you cannot go back or reset it. If you navigate away or close the browser, 
                  your interview will be automatically submitted with your current progress.
                </p>
              </div>
            </div>
          </div>

          {/* Camera Preview */}
          <div className="relative mb-8">
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden border-4 border-blue-500">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <VideoCameraIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Camera preview will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <VideoCameraIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">Camera Access</span>
              </div>
              {hasPermissions ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-gray-300" />
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <MicrophoneIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">Microphone Access</span>
              </div>
              {hasPermissions ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-gray-300" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {!hasPermissions ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push('/interviews')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={requestPermissions} className="flex-1" size="lg">
                  Grant Permissions
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push('/interviews')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleStartInterview} className="flex-1" size="lg">
                  Start Interview
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Interview view
  if (step === 'interview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Question */}
          <div className="text-center mb-8">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Question {currentQuestionIndex + 1} of {interview.questions.length}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {interview.questions[currentQuestionIndex].question}
            </h2>
            
            {/* Warning about auto-submit */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4 max-w-lg mx-auto">
              <p className="text-sm text-red-700 dark:text-red-300">
                ⚠️ Interview in progress - navigating away will auto-submit your responses
              </p>
            </div>
          </div>

          {/* Video Box - Square */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl mb-8">
            <div className="relative max-w-md mx-auto">
              <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden border-4 border-blue-500">
                <video
                  ref={(el) => {
                    if (el && stream && el.srcObject !== stream) {
                      console.log('Attaching stream to video element in interview view');
                      el.srcObject = stream;
                      el.play().catch(err => console.error('Play error:', err));
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover bg-black"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg z-10">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Recording
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Speak your answer clearly
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Your video and audio are being recorded
              </p>
            </div>
          </div>

          {/* Next Button */}
          <div className="mb-6">
            <Button 
              onClick={handleNextQuestion} 
              size="lg" 
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading video...
                </>
              ) : currentQuestionIndex < interview.questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Complete Interview
                  <CheckCircleIcon className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            
            {/* Debug: Show recording and stream status */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              {isRecording && (
                <p>Recording in progress... {Math.floor((Date.now() - startTimeRef.current) / 1000)}s</p>
              )}
              <p className="text-xs">
                Stream: {stream ? '✅ Active' : '❌ Not Active'} | 
                Tracks: {stream?.getTracks().length || 0} | 
                Video: {stream?.getVideoTracks()[0]?.enabled ? '✅' : '❌'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentQuestionIndex + 1} / {interview.questions.length}
              </span>
            </div>
            <div className="flex gap-2">
              {interview.questions.map((_: any, index: number) => (
                <div
                  key={index}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    index === currentQuestionIndex
                      ? 'bg-blue-500'
                      : index < currentQuestionIndex
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Complete view
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-16 h-16 text-green-500 animate-bounce" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🎉 Interview Submitted!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Great job completing the interview!
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-4">
          <p className="text-blue-800 dark:text-blue-200 mb-2">
            Your interview has been submitted successfully.
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Our HR team will review your responses and get back to you shortly.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Redirecting...</span>
        </div>
      </div>
    </div>
  );
}
