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
  const lastViolationTimeRef = useRef(0);

  // Add violation function
  const addViolation = useCallback((reason: string) => {
    if (isSubmittingRef.current) return;

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
      
      if (newCount >= 2 && !isSubmittingRef.current) {
        error('Maximum violations reached. Interview cancelled due to security violations.', 3000);
        isSubmittingRef.current = true;
        
        setTimeout(() => {
          submitInterview(true, 'Maximum violations reached - Interview cancelled due to cheating');
        }, 1000);
      } else if (newCount < 2) {
        const remaining = 2 - newCount;
        warning(`Security violation: ${reason}. ${remaining} remaining before interview ends.`, 4000);
      }
      
      return newCount;
    });
  }, [error, warning]);

  // Violation detection effects
  useEffect(() => {
    if (step !== 'interview') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('Tab switched or window minimized');
      }
    };

    const handleWindowBlur = () => {
      addViolation('Window lost focus');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts
      const blockedKeys = [
        'F12', // Dev tools
        'F5',  // Refresh
        'Tab', // Alt+Tab switching
      ];
      
      const blockedCombos = [
        e.ctrlKey && e.shiftKey && e.key === 'I', // Ctrl+Shift+I (Dev tools)
        e.ctrlKey && e.shiftKey && e.key === 'J', // Ctrl+Shift+J (Console)
        e.ctrlKey && e.key === 'u', // Ctrl+U (View source)
        e.ctrlKey && e.key === 'r', // Ctrl+R (Refresh)
        e.altKey && e.key === 'Tab', // Alt+Tab (Switch apps)
        e.metaKey && e.key === 'Tab', // Cmd+Tab (Mac switch apps)
        e.ctrlKey && e.key === 'w', // Ctrl+W (Close tab)
        e.ctrlKey && e.key === 't', // Ctrl+T (New tab)
        e.ctrlKey && e.shiftKey && e.key === 'T', // Ctrl+Shift+T (Reopen tab)
      ];

      if (blockedKeys.includes(e.key) || blockedCombos.some(combo => combo)) {
        e.preventDefault();
        addViolation(`Blocked keyboard shortcut: ${e.key}`);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation('Right-click context menu blocked');
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      addViolation('Attempted to leave page');
      return 'Are you sure you want to leave the interview?';
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step, addViolation]);

  // Fullscreen exit detection
  useEffect(() => {
    if (step !== 'interview') return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && step === 'interview') {
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
    } catch (err) {
      error('Failed to enter fullscreen mode');
    }
  };

  // Start interview
  const handleStartInterview = () => {
    setStep('interview');
    startRecording();
  };

  // Start recording with optimized settings
  const startRecording = () => {
    if (!stream) {
      console.error('No media stream available for recording');
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
      
      console.log('Recording with options:', options);
        
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
      
      console.log('Recording started with optimized settings');
    } catch (err) {
      console.error('Failed to start recording:', err);
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
      console.log('Uploading optimized video blob:', {
        size: videoBlob.size,
        type: videoBlob.type,
        sizeInMB: sizeInMB + 'MB'
      });

      // Check if file is too large (200MB limit)
      if (videoBlob.size > 200 * 1024 * 1024) {
        error('Video file is too large. Maximum size is 200MB.');
        return '';
      }

      // Create optimized blob with proper type
      let finalBlob = videoBlob;
      if (!videoBlob.type || videoBlob.type === '') {
        console.log('Blob has no type, setting to video/webm');
        finalBlob = new Blob([videoBlob], { type: 'video/webm' });
      }

      console.log('Final blob type:', finalBlob.type);

      const formData = new FormData();
      formData.append('video', finalBlob, `interview-${interviewId}-${Date.now()}.webm`);

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      console.log('Starting optimized upload to:', `${process.env.NEXT_PUBLIC_API_URL}/api/upload/interview-video`);
      console.log('Upload size:', sizeInMB + 'MB');
      
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
      console.log('Using API URL for video upload:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/upload/interview-video`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formData
      });

      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Upload completed in ${uploadTime} seconds`);

      if (response.ok) {
        const data = await response.json();
        console.log('Upload successful:', data);
        success(`Video uploaded successfully in ${uploadTime}s! (${sizeInMB}MB)`);
        return data.url;
      } else {
        const errorText = await response.text();
        console.error('Video upload failed:', response.status, errorText);
        
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
      console.error('Video upload error:', err);
      error('Video upload error. Please check your internet connection and try again.');
    }
    return '';
  };

  // Submit interview
  const submitInterview = async (forced = false, reason?: string) => {
    if (isSubmittingRef.current && !forced) return;
    
    if (!forced) {
      isSubmittingRef.current = true;
    }
    
    setIsUploading(true);

    try {
      console.log('Starting interview submission...');
      
      const videoBlob = await stopRecording();
      const totalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      console.log('Recording stopped, duration:', totalDuration, 'seconds');
      
      let videoUrl = '';
      if (videoBlob && videoBlob.size > 0) {
        console.log('Uploading video...');
        videoUrl = await uploadVideo(videoBlob);
        console.log('Video upload result:', videoUrl);
      } else {
        console.log('No video to upload (empty blob)');
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
      
      console.log('Submitting interview with data:', submissionData);
      
      const apiUrl = getApiUrl();
      console.log('Using API URL for interview completion:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/interviews/${interviewId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      console.log('Interview submission response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Interview submission failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Interview submission successful:', result);

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
      console.error('Interview submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown er3ror occurred';
      error(`Submission failed: ${errorMessage}`);
      setIsUploading(false);
      isSubmittingRef.current = false;
    }
  };

  // Next question
  const handleNextQuestion = () => {
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
                onClick={() => setStep('setup')} 
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
                <canvas ref={canvasRef} className="hidden" />
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

  // Interview view
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

        {/* Compact Status Bar */}
        <div className="bg-gradient-to-r from-red-900/80 to-red-800/80 backdrop-blur-sm border-b border-red-500/30 p-2 text-white flex-shrink-0 shadow-lg">
          <div className="flex items-center justify-between text-xs max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="font-bold">LIVE</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Security:</span>
                <span className={`font-bold px-1 py-0.5 rounded text-xs ${
                  violationCount === 0 ? 'bg-green-500/20 text-green-300' :
                  violationCount === 1 ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {violationCount === 0 ? 'OK' : violationCount === 1 ? 'WARN' : 'CRIT'}
                </span>
              </div>
              <span>Violations: {violationCount}/2</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={cameraActive ? 'text-green-300' : 'text-red-300'}>Cam</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${micActive ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={micActive ? 'text-green-300' : 'text-red-300'}>Mic</span>
              </div>
            </div>
          </div>
        </div>

        {/* Single Page Layout */}
        <div className="flex-1 p-3 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 h-full">
              
              {/* Main Question Area - More Space */}
              <div className="lg:col-span-4 flex flex-col">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 flex-1 flex flex-col overflow-hidden">
                  
                  {/* Compact Question Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-t-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">{currentQuestionIndex + 1}</span>
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold">Question {currentQuestionIndex + 1} of {interview.questions.length}</h2>
                          <div className="flex items-center gap-2 text-blue-100 text-xs">
                            <span>{interview.domain}</span>
                            {currentQuestion.category && (
                              <>
                                <span>•</span>
                                <span>{currentQuestion.category}</span>
                              </>
                            )}
                            {currentQuestion.difficulty && (
                              <>
                                <span>•</span>
                                <span className={`px-1 py-0.5 rounded text-xs ${
                                  currentQuestion.difficulty === 'Easy' ? 'bg-green-500/20 text-green-200' :
                                  currentQuestion.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-200' :
                                  'bg-red-500/20 text-red-200'
                                }`}>
                                  {currentQuestion.difficulty}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-blue-100">Progress</div>
                        <div className="text-sm font-bold">{Math.round(progress)}%</div>
                      </div>
                    </div>
                    
                    {/* Compact Progress Bar */}
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div 
                        className="bg-white h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Compact Question Content */}
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                      <div className="max-w-4xl text-center">
                        <div className="mb-3">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                            currentQuestionIndex === 0 
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {currentQuestionIndex === 0 ? 'Introduction' : 'Technical Question'}
                          </div>
                        </div>
                        
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-800 leading-relaxed mb-4">
                          {currentQuestion.question}
                        </h3>
                        
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.894A1 1 0 0018 16V3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-gray-800 mb-1 text-sm">Instructions</h4>
                              {currentQuestionIndex === 0 ? (
                                <ul className="text-xs text-gray-600 space-y-0.5">
                                  <li>• Introduce yourself professionally (2-3 minutes)</li>
                                  <li>• Mention education, experience, and interest in role</li>
                                  <li>• Maintain eye contact with camera</li>
                                </ul>
                              ) : (
                                <ul className="text-xs text-gray-600 space-y-0.5">
                                  <li>• Think before answering, speak clearly</li>
                                  <li>• Provide specific examples when possible</li>
                                  <li>• Click "Next Question" when finished</li>
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compact Action Buttons */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Recording
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={handleNextQuestion} 
                          size="sm" 
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1 text-sm"
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : currentQuestionIndex < interview.questions.length - 1 ? (
                            <>
                              Next Question
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </>
                          ) : (
                            <>
                              Complete Interview
                              <CheckCircleIcon className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Side Panel */}
              <div className="lg:col-span-1 flex flex-col space-y-2">
                
                {/* Compact Video Preview */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-2">
                  <div className="flex items-center gap-1 mb-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <h3 className="text-gray-800 font-semibold text-xs">Your Video</h3>
                  </div>
                  <div className="relative aspect-square bg-black rounded-lg overflow-hidden border border-blue-200">
                    <video
                      ref={(el) => {
                        if (el && stream && el.srcObject !== stream) {
                          el.srcObject = stream;
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    {isRecording && (
                      <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-red-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                        REC
                      </div>
                    )}
                  </div>
                </div>

                {/* Compact Progress Panel */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-2">
                  <div className="flex items-center gap-1 mb-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <h3 className="text-gray-800 font-semibold text-xs">Progress</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Current</span>
                      <span className="text-xs font-bold text-blue-600">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Total</span>
                      <span className="text-xs font-bold text-gray-800">{interview.questions.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Remaining</span>
                      <span className="text-xs font-bold text-orange-600">{interview.questions.length - currentQuestionIndex - 1}</span>
                    </div>
                  </div>
                </div>

                {/* Compact Question List */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-2 flex-1 overflow-hidden">
                  <div className="flex items-center gap-1 mb-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <h3 className="text-gray-800 font-semibold text-xs">Questions</h3>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-32">
                    {interview.questions.map((q: any, index: number) => (
                      <div 
                        key={index}
                        className={`p-1.5 rounded-lg text-xs transition-all ${
                          index === currentQuestionIndex 
                            ? 'bg-blue-100 border border-blue-300 text-blue-800' 
                            : index < currentQuestionIndex 
                              ? 'bg-green-50 border border-green-200 text-green-700'
                              : 'bg-gray-50 border border-gray-200 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{index + 1}.</span>
                          <span className="truncate">{q.question.substring(0, 30)}...</span>
                        </div>
                        {index < currentQuestionIndex && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircleIcon className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600">Completed</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
          violationCount >= 2 
            ? 'bg-red-100 dark:bg-red-900' 
            : 'bg-green-100 dark:bg-green-900'
        }`}>
          {violationCount >= 2 ? (
            <XCircleIcon className="w-12 h-12 text-red-500" />
          ) : (
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {violationCount >= 2 ? 'Interview Cancelled!' : 'Interview Completed!'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          {violationCount >= 2 
            ? 'Your interview was cancelled due to security violations.' 
            : 'Your interview has been submitted successfully.'
          }
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            {violationCount >= 2 
              ? 'Please contact HR if you believe this was an error.'
              : 'Our HR team will review your performance and contact you soon.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default StrictInterviewMode;