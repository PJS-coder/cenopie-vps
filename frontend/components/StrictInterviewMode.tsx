"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
    warning: (message: string, duration?: number) => addNotification(message, 'warning', duration)
  };
}

const StrictInterviewMode: React.FC<StrictInterviewModeProps> = ({
  interviewId,
  interview,
  onComplete
}) => {
  const router = useRouter();
  const { notifications, success, error, warning } = useInterviewNotifications();
  
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

  // Start recording
  const startRecording = () => {
    if (!stream) {
      console.error('No media stream available for recording');
      error('No media stream available for recording');
      return;
    }

    try {
      chunksRef.current = [];
      const options = MediaRecorder.isTypeSupported('video/webm') 
        ? { mimeType: 'video/webm' }
        : { mimeType: 'video/mp4' };
        
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(5000);
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

  // Upload video
  const uploadVideo = async (videoBlob: Blob): Promise<string> => {
    if (videoBlob.size === 0) return '';

    try {
      console.log('Uploading video blob:', {
        size: videoBlob.size,
        type: videoBlob.type,
        sizeInMB: (videoBlob.size / 1024 / 1024).toFixed(2) + 'MB'
      });

      // Create a new blob with explicit video/webm type if type is empty
      let finalBlob = videoBlob;
      if (!videoBlob.type || videoBlob.type === '') {
        console.log('Blob has no type, setting to video/webm');
        finalBlob = new Blob([videoBlob], { type: 'video/webm' });
      }

      console.log('Final blob type:', finalBlob.type);

      const formData = new FormData();
      formData.append('video', finalBlob, `interview-${interviewId}-${Date.now()}.webm`);

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      console.log('Making upload request to:', `${process.env.NEXT_PUBLIC_API_URL}/api/upload/interview-video`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/interview-video`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formData
      });

      console.log('Upload response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Upload successful:', data);
        return data.url;
      } else {
        const errorText = await response.text();
        console.error('Video upload failed:', response.status, errorText);
        error(`Video upload failed: ${response.status} ${errorText}`);
      }
    } catch (err) {
      console.error('Video upload error:', err);
      error('Video upload error');
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/complete`, {
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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
    return (
      <div className="fixed inset-0 z-[9999] h-screen w-screen bg-black flex flex-col overflow-hidden">
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification) => (
            <InterviewNotification key={notification.id} {...notification} />
          ))}
        </div>

        {/* Status Bar */}
        <div className="bg-red-900/50 border-b border-red-500 p-2 text-white flex-shrink-0">
          <div className="flex items-center justify-between text-sm max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                RECORDING
              </span>
              <span className="font-bold">Violations: {violationCount}/2</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cameraActive ? 'text-green-400' : 'text-red-400'}>
                📹 {cameraActive ? 'ON' : 'OFF'}
              </span>
              <span className={micActive ? 'text-green-400' : 'text-red-400'}>
                🎤 {micActive ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* Question Area */}
              <div className="lg:col-span-2 flex flex-col">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 flex-1 flex flex-col">
                  <div className="text-center mb-4">
                    <div className="text-xs text-gray-400 mb-2">
                      Question {currentQuestionIndex + 1} of {interview.questions.length}
                    </div>
                    <h2 className="text-lg font-bold text-white mb-3 leading-tight">
                      {interview.questions[currentQuestionIndex].question}
                    </h2>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-300">Progress</span>
                      <span className="text-xs text-gray-400">
                        {currentQuestionIndex + 1} / {interview.questions.length}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {interview.questions.map((_: any, index: number) => (
                        <div
                          key={index}
                          className={`flex-1 h-1.5 rounded-full transition-all ${
                            index === currentQuestionIndex
                              ? 'bg-[#0BC0DF]'
                              : index < currentQuestionIndex
                              ? 'bg-green-500'
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Button 
                      onClick={handleNextQuestion} 
                      size="lg" 
                      className="w-full"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : currentQuestionIndex < interview.questions.length - 1 ? (
                        <>
                          Next Question
                          <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Complete Interview
                          <CheckCircleIcon className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Video Panel */}
              <div className="lg:col-span-1 flex flex-col space-y-3">
                <div className="bg-gray-900 rounded-xl p-3 border border-gray-700 flex-1">
                  <h3 className="text-white font-medium mb-2 text-center text-sm">Your Video</h3>
                  <div className="relative aspect-square bg-black rounded-lg overflow-hidden border-2 border-[#0BC0DF]">
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
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        REC
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
                  <h3 className="text-white font-medium mb-2 text-sm">Status</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current:</span>
                      <span className="text-[#0BC0DF]">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Remaining:</span>
                      <span className="text-yellow-400">{interview.questions.length - currentQuestionIndex - 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Violations:</span>
                      <span className={violationCount >= 1 ? 'text-red-400' : 'text-green-400'}>
                        {violationCount}/2
                      </span>
                    </div>
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