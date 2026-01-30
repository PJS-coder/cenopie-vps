"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getApiUrl } from '../lib/apiUrl';
import {
  VideoCameraIcon,
  MicrophoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  ComputerDesktopIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

interface StrictInterviewModeProps {
  interviewId: string;
  interview: any;
  onComplete: () => void;
}

interface NotificationProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

// Simple Notification Component
function InterviewNotification({ id, message, type, duration = 5000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
      case 'error':
        return <XCircleIcon className="w-6 h-6 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />;
      case 'info':
        return <CheckCircleIcon className="w-6 h-6 text-blue-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-500 text-green-100';
      case 'error':
        return 'bg-red-900/90 border-red-500 text-red-100';
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-500 text-yellow-100';
      case 'info':
        return 'bg-blue-900/90 border-blue-500 text-blue-100';
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'
      }`}
    >
      <div className={`rounded-xl shadow-2xl border-2 p-4 max-w-md backdrop-blur-sm ${getStyles()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-relaxed break-words">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors ml-2"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom hook for notifications
function useInterviewNotifications() {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = useCallback((message: string, type: NotificationProps['type'], duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const notification: NotificationProps = {
      id,
      message,
      type,
      duration,
      onClose: (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    };
    setNotifications(prev => [...prev, notification]);
  }, []);

  return {
    notifications,
    success: (message: string, duration?: number) => addNotification(message, 'success', duration),
    error: (message: string, duration?: number) => addNotification(message, 'error', duration),
    warning: (message: string, duration?: number) => addNotification(message, 'warning', duration),
    info: (message: string, duration?: number) => addNotification(message, 'info', duration)
  };
}

const StrictInterviewMode: React.FC<StrictInterviewModeProps> = ({
  interviewId,
  interview,
  onComplete
}) => {
  const router = useRouter();
  const { notifications, success, error, warning, info } = useInterviewNotifications();
  
  // ALL HOOKS MUST BE DECLARED AT THE TOP - NO CONDITIONAL HOOKS
  // Check for previous session state
  const [wasInterviewActive, setWasInterviewActive] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Basic states
  const [step, setStep] = useState<'device-check' | 'setup' | 'interview' | 'complete'>('device-check');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Media states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const isSubmittingRef = useRef(false);

  // VIOLATION DETECTION SYSTEM
  const [violations, setViolations] = useState<string[]>([]);
  const [violationCount, setViolationCount] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showFullscreenAlert, setShowFullscreenAlert] = useState(false);
  const lastViolationTimeRef = useRef(0);

  // Submit rejected interview to backend (so it's counted as rejected)
  const submitRejectedInterview = useCallback(async (reason: string) => {
    try {
      const totalDuration = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const rejectionData = {
        status: 'rejected',
        rejectionReason: reason,
        totalDuration,
        securityViolations: violations,
        violationCount: violationCount,
        completedAt: new Date().toISOString()
      };
      
      const apiUrl = getApiUrl();
      
      const response = await fetch(`${apiUrl}/api/interviews/${interviewId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(rejectionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Silently fail - don't show error to user during violation
      }
    } catch (err) {
      // Silently fail - don't show error to user during violation
    }
  }, [violations, violationCount, interviewId]);

  // Add violation function - STRICT VERSION
  const addViolation = useCallback((reason: string) => {
    if (isSubmittingRef.current || isCancelled) return;

    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1000) return;
    
    lastViolationTimeRef.current = now;
    const violationEntry = `${new Date().toLocaleTimeString()}: ${reason}`;
    
    setViolations(prev => {
      const newViolations = [...prev, violationEntry];
      return newViolations;
    });
    
    setViolationCount(prev => {
      const newCount = prev + 1;
      
      if (newCount >= 2) {
        // IMMEDIATE KICK OUT - NO MERCY
        setIsCancelled(true);
        isSubmittingRef.current = true;
        
        // Stop everything immediately
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        
        // Clear session data
        localStorage.removeItem('activeInterviewId');
        localStorage.removeItem('interviewStep');
        
        // Submit interview as REJECTED to backend (so it's counted)
        submitRejectedInterview('Interview rejected due to security violations');
        
        // Store simple cancellation message for UI
        localStorage.setItem('interviewCancelled', 'true');
        localStorage.setItem('cancellationMessage', 'you find doing useless things that\'s why we cancelled interview');
        localStorage.setItem('cancelledInterviewId', interviewId);
        
        // Show immediate error message
        error('you find doing useless things that\'s why we cancelled interview', 5000);
        
        // Redirect will be handled by useEffect
      } else {
        // First violation warning
        warning(`Security violation detected: ${reason}. One more violation will cancel your interview.`, 4000);
      }
      
      return newCount;
    });
  }, [warning, error, isCancelled, stream, interviewId, submitRejectedInterview]);

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeInterviewId = localStorage.getItem('activeInterviewId');
      const interviewStep = localStorage.getItem('interviewStep');
      const isActive = activeInterviewId === interviewId && (interviewStep === 'interview' || interviewStep === 'setup');
      
      if (isActive) {
        // Clear the session data and store cancellation info
        localStorage.removeItem('activeInterviewId');
        localStorage.removeItem('interviewStep');
        
        // Store cancellation info for interviews page
        localStorage.setItem('interviewCancelled', 'true');
        localStorage.setItem('cancellationReason', 'hard-refresh');
        localStorage.setItem('cancellationMessage', 'Interview cancelled due to page refresh or browser restart');
        localStorage.setItem('cancelledInterviewId', interviewId);
        
        setWasInterviewActive(true);
        setShouldRedirect(true);
      }
    }
  }, [interviewId]);

  // Handle redirect in separate effect
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        router.push('/interviews');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, router]);

  // Cleanup function to clear localStorage if component unmounts unexpectedly
  useEffect(() => {
    return () => {
      const activeInterviewId = localStorage.getItem('activeInterviewId');
      if (activeInterviewId === interviewId) {
        localStorage.removeItem('activeInterviewId');
        localStorage.removeItem('interviewStep');
      }
    };
  }, [interviewId]);

  // Handle redirect when interview is cancelled due to violations
  useEffect(() => {
    if (isCancelled && violationCount >= 2) {
      const timer = setTimeout(() => {
        router.push('/interviews');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isCancelled, violationCount, router]);

  // ULTRA STRICT violation detection
  useEffect(() => {
    if (step !== 'interview') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('Tab switched or window minimized');
      }
    };

    const handleWindowBlur = () => {
      addViolation('Window lost focus - attempted to switch applications');
    };

    // ULTRA STRICT KEY BLOCKING - BLOCK SILENTLY (NO VIOLATIONS)
    const handleKeyDown = (e: KeyboardEvent) => {
      // BLOCK ALL MODIFIER KEYS COMPLETELY - NO VIOLATION, JUST BLOCK
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
      
      // BLOCK ALL FUNCTION KEYS - NO VIOLATION, JUST BLOCK
      if (e.key.startsWith('F') && e.key.length <= 3) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
      
      // BLOCK NAVIGATION AND SYSTEM KEYS - NO VIOLATION, JUST BLOCK
      const blockedKeys = [
        'Tab', 'Escape', 'Insert', 'Delete', 'Home', 'End', 
        'PageUp', 'PageDown', 'PrintScreen', 'ScrollLock', 'Pause'
      ];
      
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
      
      // BLOCK CONTEXT MENU KEY - NO VIOLATION, JUST BLOCK
      if (e.key === 'ContextMenu') {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // BROWSER EXIT = VIOLATION (actual cheating attempt)
      e.preventDefault();
      addViolation('Attempted to exit browser during interview');
      
      return 'Leaving will cancel your interview!';
    };

    // STRICT MOUSE CONTROL - BLOCK SILENTLY (NO VIOLATIONS)
    const handleMouseDown = (e: MouseEvent) => {
      // Block middle mouse and navigation buttons - NO VIOLATION, JUST BLOCK
      if (e.button === 1 || e.button === 3 || e.button === 4) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Block right-click - NO VIOLATION, JUST BLOCK
      e.preventDefault();
    };

    // Add STRICT event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('mousedown', handleMouseDown);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [step, addViolation]);

  // Fullscreen exit detection
  useEffect(() => {
    if (step !== 'interview') return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && step === 'interview') {
        setShowFullscreenAlert(true);
        addViolation('Exited fullscreen mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [step, addViolation]);

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
      const screenWidth = window.screen.width;
      
      const isDesktopDevice = !isMobile && !isTablet && screenWidth >= 1024;
      setIsDesktop(isDesktopDevice);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Connect stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  // ALL HOOKS DECLARED ABOVE - NOW SAFE FOR EARLY RETURNS

  // Show loading while redirecting
  if (wasInterviewActive && shouldRedirect) {
    return (
      <div className="fixed inset-0 z-[9999] h-screen w-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Interview cancelled - redirecting...</p>
        </div>
      </div>
    );
  }

  // Request permissions
  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      setStream(mediaStream);
      setHasPermissions(true);
      setCameraActive(true);
      setMicActive(true);
      
      success('Camera and microphone access granted');
    } catch (err) {
      error('Failed to access camera and microphone. Please grant permissions and try again.');
    }
  };

  // Enter fullscreen
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenAlert(false); // Hide alert when back in fullscreen
    } catch (err) {
      error('Failed to enter fullscreen mode');
    }
  };

  // Start interview
  const handleStartInterview = () => {
    // Track that user is now in interview mode
    localStorage.setItem('activeInterviewId', interviewId);
    localStorage.setItem('interviewStep', 'interview');
    
    setStep('interview');
    startRecording();
  };

  // Start recording with optimized settings
  const startRecording = () => {
    if (!stream) {
      error('No media stream available for recording');
      return;
    }

    try {
      chunksRef.current = [];
      
      // Optimized recording options for smaller file sizes
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9,opus', // VP9 codec for better compression
        videoBitsPerSecond: 1000000, // 1 Mbps - good quality, smaller size
        audioBitsPerSecond: 128000   // 128 kbps audio
      };
      
      // Fallback options if VP9 is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
        options.videoBitsPerSecond = 1500000; // Slightly higher for VP8
      }
      
      // Final fallback
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm';
        options.videoBitsPerSecond = 2000000; // Higher bitrate for basic webm
      }
        
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Record in smaller chunks for better performance
      mediaRecorder.start(3000); // 3-second chunks instead of 5
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      error('Failed to start recording');
    }
  };

  // Stop recording
  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(new Blob());
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
    });
  };

  // Upload video with compression and parallel processing
  const uploadVideo = async (videoBlob: Blob): Promise<string> => {
    if (videoBlob.size === 0) return '';

    try {
      const sizeInMB = (videoBlob.size / 1024 / 1024).toFixed(2);

      // Check if file is too large (200MB limit)
      if (videoBlob.size > 200 * 1024 * 1024) {
        error('Video file is too large. Maximum size is 200MB.');
        return '';
      }

      // Create optimized blob with proper type
      let finalBlob = videoBlob;
      if (!videoBlob.type || videoBlob.type === '') {
        finalBlob = new Blob([videoBlob], { type: 'video/webm' });
      }

      const formData = new FormData();
      formData.append('video', finalBlob, `interview-${interviewId}-${Date.now()}.webm`);

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      // Show appropriate upload message based on size
      if (parseFloat(sizeInMB) > 100) {
        warning(`Uploading large video (${sizeInMB}MB). Estimated time: 2-3 minutes...`, 8000);
      } else if (parseFloat(sizeInMB) > 50) {
        warning(`Uploading video (${sizeInMB}MB). Estimated time: 1-2 minutes...`, 6000);
      } else {
        success(`Uploading video (${sizeInMB}MB). This should be quick...`, 4000);
      }
      
      const startTime = Date.now();
      
      const apiUrl = getApiUrl();
      
      const response = await fetch(`${apiUrl}/api/upload/interview-video`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formData
      });

      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1);

      if (response.ok) {
        const data = await response.json();
        success(`Video uploaded successfully in ${uploadTime}s! (${sizeInMB}MB)`);
        return data.url;
      } else {
        const errorText = await response.text();
        
        // Parse error for better user feedback
        let errorMessage = `Upload failed (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Use default message
        }
        
        error(`Video upload failed: ${errorMessage}`);
      }
    } catch (err) {
      error('Video upload error. Please check your internet connection and try again.');
    }
    return '';
  };

  // Cancel interview function
  const cancelInterview = async (reason: string) => {
    if (isSubmittingRef.current && !isCancelled) return;
    
    setIsUploading(false);
    setIsCancelled(true);

    try {
      // Clear localStorage tracking
      localStorage.removeItem('activeInterviewId');
      localStorage.removeItem('interviewStep');
      
      // Store cancellation info for interviews page
      localStorage.setItem('interviewCancelled', 'true');
      localStorage.setItem('cancellationReason', 'browser-exit');
      localStorage.setItem('cancellationMessage', 'Your interview gets cancelled. To start new interview press start new interview');
      localStorage.setItem('cancelledInterviewId', interviewId);
      
      // Stop recording without uploading
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      
      // Stop media streams
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      
      // Show cancellation message and redirect to interviews page
      setTimeout(() => {
        error('Interview cancelled: ' + reason, 5000);
        router.push('/interviews');
      }, 500);
      
    } catch (err) {
      // Still redirect even if there's an error
      setTimeout(() => {
        router.push('/interviews');
      }, 1000);
    }
  };

  // Submit interview
  const submitInterview = async (forced = false, reason?: string) => {
    if (isSubmittingRef.current && !forced) return;
    if (isCancelled) return; // Don't submit if cancelled
    
    if (!forced) {
      isSubmittingRef.current = true;
    }
    
    setIsUploading(true);

    try {
      const videoBlob = await stopRecording();
      const totalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      let videoUrl = '';
      if (videoBlob && videoBlob.size > 0) {
        videoUrl = await uploadVideo(videoBlob);
      }

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const submissionData = {
        totalDuration,
        videoUrl,
        securityViolations: violations,
        violationCount: violationCount,
        forcedSubmission: forced,
        submissionReason: reason
      };
      
      const apiUrl = getApiUrl();
      
      const response = await fetch(`${apiUrl}/api/interviews/${interviewId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Clear localStorage tracking since interview completed successfully
      localStorage.removeItem('activeInterviewId');
      localStorage.removeItem('interviewStep');

      setStep('complete');
      setIsUploading(false);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      success('Interview submitted successfully!');
      onComplete();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error(`Submission failed: ${errorMessage}`);
      setIsUploading(false);
      isSubmittingRef.current = false;
    }
  };

  // Next question
  const handleNextQuestion = () => {
    if (isCancelled || isSubmittingRef.current) return;
    
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitInterview();
    }
  };

  // Device check view
  if (step === 'device-check') {
    return (
      <div className="fixed inset-0 z-[9999] h-screen w-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification) => (
            <InterviewNotification key={notification.id} {...notification} />
          ))}
        </div>

        <div className="max-w-2xl w-full mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Device Compatibility Check
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Strict interview mode requires a desktop or laptop computer
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <ComputerDesktopIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">Desktop/Laptop Required</span>
              </div>
              {isDesktop ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-500" />
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push('/interviews')}
              className="flex-1"
            >
              Cancel
            </Button>
            {isDesktop ? (
              <Button 
                onClick={() => {
                  // Track that user is now in setup mode
                  localStorage.setItem('activeInterviewId', interviewId);
                  localStorage.setItem('interviewStep', 'setup');
                  setStep('setup');
                }} 
                className="flex-1"
              >
                Continue
              </Button>
            ) : (
              <Button disabled className="flex-1">
                Desktop Required
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Setup view
  if (step === 'setup') {
    return (
      <div className="fixed inset-0 z-[9999] h-screen w-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification) => (
            <InterviewNotification key={notification.id} {...notification} />
          ))}
        </div>

        <div className="max-w-4xl w-full mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Strict Interview Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            {interview.domain} • {interview.questions.length} Questions
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Camera Preview</h3>
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <VideoCameraIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Camera access required</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Requirements</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <VideoCameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Camera Active</span>
                  </div>
                  {hasPermissions && cameraActive ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MicrophoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Microphone Active</span>
                  </div>
                  {hasPermissions && micActive ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ArrowsPointingOutIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Fullscreen Mode</span>
                  </div>
                  {isFullscreen ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-6">
                {!hasPermissions && (
                  <Button onClick={requestPermissions} className="w-full" size="lg">
                    Grant Camera & Microphone Access
                  </Button>
                )}
                
                {hasPermissions && !isFullscreen && (
                  <Button onClick={enterFullscreen} className="w-full" size="lg">
                    <ArrowsPointingOutIcon className="w-5 h-5 mr-2" />
                    Enter Fullscreen
                  </Button>
                )}
                
                {hasPermissions && isFullscreen && (
                  <Button onClick={handleStartInterview} className="w-full" size="lg">
                    Start Strict Interview
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interview view - simplified for brevity
  if (step === 'interview') {
    const currentQuestion = interview.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;
    
    return (
      <div className="fixed inset-0 z-[9999] h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification) => (
            <InterviewNotification key={notification.id} {...notification} />
          ))}
        </div>

        {/* Fullscreen Exit Alert */}
        {showFullscreenAlert && (
          <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-red-900/95 border-2 border-red-500 rounded-xl p-6 max-w-md mx-4 text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Fullscreen Required!
              </h3>
              <p className="text-red-200 mb-6 text-sm">
                You have exited fullscreen mode. This is a security violation. Please return to fullscreen to continue your interview.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={enterFullscreen}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <ArrowsPointingOutIcon className="w-4 h-4 mr-2" />
                  Return to Fullscreen
                </Button>
              </div>
              <p className="text-xs text-red-300 mt-3">
                Violation {violationCount}/2 - Interview will be cancelled after 2 violations
              </p>
            </div>
          </div>
        )}

        {/* Simplified interview content */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="max-w-4xl w-full bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Question {currentQuestionIndex + 1} of {interview.questions.length}
            </h2>
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                {currentQuestion.question}
              </h3>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording
              </div>
              <Button 
                onClick={handleNextQuestion} 
                disabled={isUploading || isCancelled}
                className="px-6 py-2"
              >
                {isCancelled ? (
                  'Cancelled'
                ) : isUploading ? (
                  'Processing...'
                ) : currentQuestionIndex < interview.questions.length - 1 ? (
                  'Next Question'
                ) : (
                  'Complete Interview'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Complete view
  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {notifications.map((notification) => (
          <InterviewNotification key={notification.id} {...notification} />
        ))}
      </div>

      <div className="text-center max-w-md mx-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100 dark:bg-green-900">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Interview Completed!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Your interview has been submitted successfully.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Our HR team will review your performance and contact you soon.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={() => router.push('/interviews')}
          className="w-full"
        >
          Back to Interviews
        </Button>
      </div>
    </div>
  );
};

export default StrictInterviewMode;