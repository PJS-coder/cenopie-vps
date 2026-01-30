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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(720); // 12 minutes in seconds (720)
  const [interviewStartTime, setInterviewStartTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const isSubmittingRef = useRef(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        
        // Show prominent cancellation modal before redirect
        const showCancellationModal = () => {
          const modal = document.createElement('div');
          modal.className = 'fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center';
          modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl border-2 border-red-500">
              <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Interview Cancelled</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">Your interview is canceled, start new</p>
              <div class="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold">
                Redirecting to New Interview...
              </div>
            </div>
          `;
          document.body.appendChild(modal);
          
          // Remove modal after redirect
          setTimeout(() => {
            if (document.body.contains(modal)) {
              document.body.removeChild(modal);
            }
          }, 3000);
        };
        
        showCancellationModal();
        
        // Store simple cancellation message for UI
        localStorage.setItem('interviewCancelled', 'true');
        localStorage.setItem('cancellationMessage', 'Your interview is canceled, start new');
        localStorage.setItem('cancelledInterviewId', interviewId);
        
        // Show immediate error message
        error('Your interview is canceled, start new', 5000);
        
        // Redirect to new interview page instead of same interview
        setTimeout(() => {
          router.push(`/interviews/new`);
        }, 2000);
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
      // Clear any previous cancellation messages when starting fresh
      localStorage.removeItem('interviewCancelled');
      localStorage.removeItem('cancellationMessage');
      localStorage.removeItem('cancellationReason');
      localStorage.removeItem('cancelledInterviewId');
      
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
        localStorage.setItem('cancellationMessage', 'Your interview is canceled, start new');
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
        router.push(`/interviews/new`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, router, interviewId]);

  // Upload protection - prevent page exit during upload
  useEffect(() => {
    if (!isUploading) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      const message = 'Your interview is still uploading! Leaving now will cancel your submission.';
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isUploading]);

  // Cleanup function to clear localStorage if component unmounts unexpectedly
  useEffect(() => {
    return () => {
      const activeInterviewId = localStorage.getItem('activeInterviewId');
      if (activeInterviewId === interviewId) {
        localStorage.removeItem('activeInterviewId');
        localStorage.removeItem('interviewStep');
      }
      
      // Cleanup timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [interviewId]);

  // Handle redirect when interview is cancelled due to violations
  useEffect(() => {
    if (isCancelled && violationCount >= 2) {
      const timer = setTimeout(() => {
        // Redirect to new interview page instead of same interview
        router.push(`/interviews/new`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isCancelled, violationCount, router, interviewId]);

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

  // Timer logic for 12-minute limit
  useEffect(() => {
    if (step === 'interview' && !isCancelled) {
      // Start the timer
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto submit
            submitInterview(true, 'Time limit reached');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [step, isCancelled]);

  // Format time remaining for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ALL HOOKS DECLARED ABOVE - NOW SAFE FOR EARLY RETURNS

  // Show loading while redirecting with cancellation message
  if (wasInterviewActive && shouldRedirect) {
    return (
      <div className="fixed inset-0 z-[9999] h-screen w-screen bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl border-2 border-red-500">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Interview Cancelled</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Your interview is canceled, start new</p>
          <div className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold">
            Redirecting to New Interview...
          </div>
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
    
    // Initialize timer
    const startTime = Date.now();
    setInterviewStartTime(startTime);
    setTimeRemaining(720); // Reset to 12 minutes
    
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

  // New simplified upload process with progress tracking
  const uploadVideoNew = async (videoBlob: Blob): Promise<string> => {
    if (!videoBlob || videoBlob.size === 0) {
      warning('No video data to upload');
      return '';
    }

    try {
      const sizeInMB = (videoBlob.size / 1024 / 1024).toFixed(2);
      info(`Preparing to upload video (${sizeInMB}MB)...`);
      setUploadProgress(0);

      // Ensure the blob has the correct MIME type
      let correctedBlob = videoBlob;
      if (!videoBlob.type || videoBlob.type === '' || videoBlob.type === 'text/plain') {
        console.log('Correcting video blob MIME type to video/webm');
        correctedBlob = new Blob([videoBlob], { type: 'video/webm' });
      }

      // Create form data with the video
      const formData = new FormData();
      const timestamp = Date.now();
      const fileName = `interview-${interviewId}-${timestamp}.webm`;
      formData.append('video', correctedBlob, fileName);
      formData.append('interviewId', interviewId);
      formData.append('timestamp', timestamp.toString());

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Upload with progress tracking using XMLHttpRequest
      const apiUrl = getApiUrl();
      const uploadStartTime = Date.now();
      
      info(`Uploading video... (${sizeInMB}MB)`);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
            
            // Update info message with progress
            if (percentComplete < 100) {
              info(`Uploading video... ${percentComplete}% (${sizeInMB}MB)`);
            }
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              
              if (!result.url) {
                reject(new Error('No video URL returned from server'));
                return;
              }

              success(`Video uploaded successfully in ${uploadDuration}s!`);
              setUploadProgress(100);
              resolve(result.url);
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            let errorMessage = `Upload failed (${xhr.status})`;
            
            try {
              const errorData = JSON.parse(xhr.responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
              // Use default message
            }
            
            reject(new Error(errorMessage));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        // Handle timeout
        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timeout'));
        });

        // Configure and send request
        xhr.open('POST', `${apiUrl}/api/upload/interview-video`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.timeout = 300000; // 5 minutes timeout
        xhr.send(formData);
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      error(`Video upload error: ${errorMessage}`);
      setUploadProgress(0);
      throw err;
    }
  };

  // Cancel interview function
  const cancelInterview = async (reason: string) => {
    if (isSubmittingRef.current && !isCancelled) return;
    
    setIsUploading(false);
    setIsCancelled(true);

    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    try {
      // Clear localStorage tracking
      localStorage.removeItem('activeInterviewId');
      localStorage.removeItem('interviewStep');
      
      // Store cancellation info for interviews page
      localStorage.setItem('interviewCancelled', 'true');
      localStorage.setItem('cancellationReason', 'browser-exit');
      localStorage.setItem('cancellationMessage', 'Your interview is canceled, start new');
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
      
      // Show cancellation message and redirect to new interview page
      setTimeout(() => {
        error('Your interview is canceled, start new', 5000);
        router.push(`/interviews/new`);
      }, 500);
      
    } catch (err) {
      // Still redirect even if there's an error
      setTimeout(() => {
        router.push(`/interviews/new`);
      }, 1000);
    }
  };

  // Submit interview with new upload process
  const submitInterview = async (forced = false, reason?: string) => {
    if (isSubmittingRef.current && !forced) return;
    if (isCancelled) return; // Don't submit if cancelled
    
    if (!forced) {
      isSubmittingRef.current = true;
    }
    
    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Stop recording and get video blob
      const videoBlob = await stopRecording();
      const totalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Upload video using new process
      let videoUrl = '';
      if (videoBlob && videoBlob.size > 0) {
        videoUrl = await uploadVideoNew(videoBlob);
      }

      // Prepare submission data
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const submissionData = {
        totalDuration,
        videoUrl,
        securityViolations: violations,
        violationCount: violationCount,
        forcedSubmission: forced,
        submissionReason: reason,
        timeRemaining: timeRemaining,
        completedQuestions: currentQuestionIndex + 1,
        totalQuestions: 5 // Fixed to 5 questions
      };
      
      // Submit to backend
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
        throw new Error(`Submission failed: HTTP ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Clear localStorage tracking since interview completed successfully
      localStorage.removeItem('activeInterviewId');
      localStorage.removeItem('interviewStep');

      // Clean up media streams
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      setStep('complete');
      setIsUploading(false);
      setUploadProgress(0);
      success('Interview submitted successfully!');
      onComplete();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error(`Submission failed: ${errorMessage}`);
      setIsUploading(false);
      setUploadProgress(0);
      isSubmittingRef.current = false;
    }
  };

  // Next question (exactly 5 questions)
  const handleNextQuestion = () => {
    if (isCancelled || isSubmittingRef.current) return;
    
    if (currentQuestionIndex < 4) { // Stop at index 4 (5 questions total: 0,1,2,3,4)
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
              onClick={() => router.push('/interviews/new')}
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
            {interview.domain} • 5 Questions • 12 Minutes
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

  // Interview view - with timer and exactly 5 questions
  if (step === 'interview') {
    const currentQuestion = interview.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / 5) * 100; // Fixed to 5 questions
    const isTimeRunningOut = timeRemaining <= 180; // Last 3 minutes for 12-minute interview
    
    return (
      <div className="fixed inset-0 z-[9999] h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification) => (
            <InterviewNotification key={notification.id} {...notification} />
          ))}
        </div>

        {/* Timer Display */}
        <div className="fixed top-4 left-4 z-50">
          <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${
            isTimeRunningOut 
              ? 'bg-red-900/90 text-red-100 border-2 border-red-500 animate-pulse' 
              : 'bg-black/50 text-white border border-gray-600'
          }`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
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

        {/* Interview content */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="max-w-4xl w-full bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Question {currentQuestionIndex + 1} of 5
              </h2>
              <div className="text-sm text-gray-600">
                {isTimeRunningOut && (
                  <span className="text-red-600 font-bold animate-pulse">
                    ⚠️ Time running out!
                  </span>
                )}
              </div>
            </div>
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
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Recording
                </div>
                <div className="flex items-center gap-2">
                  <span>Time: {formatTime(timeRemaining)}</span>
                </div>
              </div>
              
              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Uploading Interview</span>
                    <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    Please wait while your interview is being uploaded...
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3 rounded">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Don't quit! Your interview is uploading.
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Closing this page or browser will cancel your interview submission.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleNextQuestion} 
                disabled={isUploading || isCancelled}
                className="px-6 py-2"
              >
                {isCancelled ? (
                  'Cancelled'
                ) : isUploading ? (
                  'Processing...'
                ) : currentQuestionIndex < 4 ? ( // Fixed to 4 for 5 questions (0,1,2,3,4)
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
          onClick={() => router.push('/interviews/new')}
          className="w-full"
        >
          Start New Interview
        </Button>
      </div>
    </div>
  );
};

export default StrictInterviewMode;