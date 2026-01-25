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
  DevicePhoneMobileIcon,
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

// Simple Notification Hook
function useInterviewNotifications() {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = useCallback((message: string, type: NotificationProps['type'] = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: NotificationProps = { 
      id, 
      message, 
      type, 
      duration,
      onClose: (id: string) => removeNotification(id)
    };
    
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    addNotification(message, 'success', duration);
  }, [addNotification]);

  const error = useCallback((message: string, duration?: number) => {
    addNotification(message, 'error', duration);
  }, [addNotification]);

  const warning = useCallback((message: string, duration?: number) => {
    addNotification(message, 'warning', duration);
  }, [addNotification]);

  const info = useCallback((message: string, duration?: number) => {
    addNotification(message, 'info', duration);
  }, [addNotification]);

  return {
    notifications,
    success,
    error,
    warning,
    info,
    removeNotification
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
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Media states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const isSubmittingRef = useRef(false);

  // SIMPLE VIOLATION SYSTEM
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

  // Upload video
  const uploadVideo = async (videoBlob: Blob): Promise<string> => {
    if (videoBlob.size === 0) return '';

    try {
      const formData = new FormData();
      formData.append('video', videoBlob, `interview-${interviewId}.webm`);

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/interview-video`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (err) {
      // Silent fail for video upload
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/complete`, {
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

      // Complete the interview
      setStep('complete');
      setIsUploading(false);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      onComplete();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error(`Submission failed: ${errorMessage}`);
      setIsUploading(false);
      isSubmittingRef.current = false;
    }
  };

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

  // Fullscreen monitoring
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (isInterviewStarted && !isCurrentlyFullscreen && step === 'interview') {
        addViolation('Exited fullscreen mode');
      }
    };

    // Add multiple event listeners for better browser compatibility
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isInterviewStarted, step, addViolation]);

  // Focus monitoring
  useEffect(() => {
    if (!isInterviewStarted || step !== 'interview') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('Switched to another tab/app');
      }
    };

    const handleWindowBlur = () => {
      addViolation('Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isInterviewStarted, step, addViolation]);

  // Face detection
  const startFaceDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const detectFace = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || video.readyState !== 4) {
        setFaceDetected(false);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const faceDetected = detectFaceInImageData(imageData);
      setFaceDetected(faceDetected);
    };

    faceDetectionIntervalRef.current = setInterval(detectFace, 1000);
  };

  const detectFaceInImageData = (imageData: ImageData): boolean => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const faceAreaLeft = Math.floor(width * 0.2);
    const faceAreaRight = Math.floor(width * 0.8);
    const faceAreaTop = Math.floor(height * 0.2);
    const faceAreaBottom = Math.floor(height * 0.8);
    
    let skinPixels = 0;
    let totalPixels = 0;
    
    for (let y = faceAreaTop; y < faceAreaBottom; y += 4) {
      for (let x = faceAreaLeft; x < faceAreaRight; x += 4) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        const isSkinTone = (
          r > 95 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 15
        );
        
        if (isSkinTone) skinPixels++;
        totalPixels++;
      }
    }
    
    return skinPixels / totalPixels > 0.15;
  };

  // Keyboard shortcuts prevention
  useEffect(() => {
    if (!isInterviewStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const forbiddenKeys = ['F12', 'F5', 'F11', 'Escape'];
      const forbiddenCombos = [
        e.ctrlKey && e.shiftKey && e.key === 'I',
        e.ctrlKey && e.key === 'r',
        e.ctrlKey && e.key === 'w',
        e.altKey && e.key === 'Tab',
        e.metaKey && e.key === 'Tab'
      ];

      if (forbiddenKeys.includes(e.key) || forbiddenCombos.some(combo => combo)) {
        e.preventDefault();
        
        // Special handling for Escape key during interview
        if (e.key === 'Escape' && step === 'interview') {
          addViolation('Attempted to exit fullscreen');
        } else {
          addViolation(`Attempted forbidden key: ${e.key}`);
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation('Attempted right-click');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isInterviewStarted, addViolation, step]);

  // Page unload protection
  useEffect(() => {
    if (!isInterviewStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step === 'interview' && !isSubmittingRef.current) {
        e.preventDefault();
        e.returnValue = 'Interview in progress. Leaving will auto-submit.';
        
        // Auto-submit on unload
        setTimeout(() => {
          submitInterview(true, 'Page unload/reload');
        }, 100);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isInterviewStarted, step]);

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
      success('Camera and microphone access granted!');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startFaceDetection();
        };
      }
      
      // Monitor stream
      mediaStream.getTracks().forEach(track => {
        track.onended = () => {
          if (track.kind === 'video') {
            setCameraActive(false);
            if (isInterviewStarted) addViolation('Camera disabled');
          } else if (track.kind === 'audio') {
            setMicActive(false);
            if (isInterviewStarted) addViolation('Microphone disabled');
          }
        };
      });

    } catch (err) {
      error('Camera and microphone access required for interview.');
    }
  };

  // Enter fullscreen
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      success('Fullscreen mode activated!');
    } catch (err) {
      error('Fullscreen mode required. Please try F11 or browser fullscreen.');
    }
  };

  // Start interview
  const handleStartInterview = async () => {
    if (!hasPermissions || !stream || !isFullscreen || !faceDetected) {
      error('Please complete all setup requirements.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setViolations([]);
      setViolationCount(0);
      lastViolationTimeRef.current = 0;
      isSubmittingRef.current = false;

      setIsInterviewStarted(true);
      setStep('interview');
      startRecording();
      success('Interview started successfully! Remember: Zero tolerance for cheating.');
    } catch (err) {
      error('Failed to start interview.');
    }
  };

  // Start recording
  const startRecording = () => {
    if (!stream) return;

    try {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

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
      error('Failed to start recording.');
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
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
    });
  };

  // Next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitInterview();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
      }
    };
  }, [stream]);

  // Device check view
  if (step === 'device-check') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification) => (
            <InterviewNotification key={notification.id} {...notification} />
          ))}
        </div>

        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Device Compatibility Check
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Strict interview mode requires a desktop or laptop computer
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-semibold text-sm">
                ⚠️ WARNING: This interview has ZERO TOLERANCE for cheating
              </p>
              <p className="text-red-700 dark:text-red-300 text-xs mt-1">
                Any attempt to cheat will result in immediate cancellation
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              isDesktop 
                ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
                : 'border-red-200 bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center gap-3">
                <ComputerDesktopIcon className={`w-6 h-6 ${isDesktop ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-gray-900 dark:text-white">Desktop/Laptop Required</span>
              </div>
              {isDesktop ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-500" />
              )}
            </div>
          </div>

          <div className="flex gap-4">
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
                Continue to Setup
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button 
                disabled 
                className="flex-1"
              >
                Device Not Compatible
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification) => (
            <InterviewNotification key={notification.id} {...notification} />
          ))}
        </div>

        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Strict Interview Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            {interview.domain} • {interview.questions.length} Questions
          </p>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  ⚠️ STRICT ANTI-CHEATING POLICY
                </h3>
                <div className="text-sm text-red-700 dark:text-red-300 space-y-2">
                  <p className="font-medium">READ CAREFULLY - Your interview will be CANCELLED if you:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• Exit fullscreen mode</li>
                    <li>• Switch to another tab or application</li>
                    <li>• Disable camera or microphone</li>
                    <li>• Use keyboard shortcuts (F12, Ctrl+R, etc.)</li>
                    <li>• Try to cheat in any way</li>
                  </ul>
                  <p className="font-bold text-red-800 dark:text-red-200 mt-3">
                    🚨 ZERO TOLERANCE FOR CHEATING
                  </p>
                  <p className="text-xs">
                    This interview is monitored for security violations. Play fair and demonstrate your genuine skills.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mb-8">
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden border-4 border-blue-500 relative">
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
                    <VideoCameraIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Camera preview will appear here</p>
                  </div>
                </div>
              )}
              {stream && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  <span className="text-white text-sm font-medium">
                    {faceDetected ? 'Face Detected' : 'No Face Detected'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className={`flex items-center justify-between p-4 rounded-lg ${
              hasPermissions && cameraActive 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <VideoCameraIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">Camera Active</span>
              </div>
              {hasPermissions && cameraActive ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-gray-300" />
              )}
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg ${
              hasPermissions && micActive 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <MicrophoneIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">Microphone Active</span>
              </div>
              {hasPermissions && micActive ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-gray-300" />
              )}
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg ${
              isFullscreen 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <ComputerDesktopIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">Fullscreen Mode</span>
              </div>
              {isFullscreen ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-gray-300" />
              )}
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg ${
              faceDetected 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium text-gray-900 dark:text-white">Face Visible</span>
              </div>
              {faceDetected ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-gray-300" />
              )}
            </div>
          </div>

          <div className="space-y-4">
            {!hasPermissions && (
              <Button onClick={requestPermissions} className="w-full" size="lg">
                Grant Camera & Microphone Access
              </Button>
            )}
            
            {hasPermissions && !isFullscreen && (
              <Button onClick={enterFullscreen} className="w-full" size="lg">
                <ArrowsPointingOutIcon className="w-5 h-5 mr-2" />
                Enter Fullscreen Mode
              </Button>
            )}
            
            {hasPermissions && isFullscreen && faceDetected && (
              <Button onClick={handleStartInterview} className="w-full" size="lg">
                Start Strict Interview
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            )}

            {hasPermissions && isFullscreen && !faceDetected && (
              <Button disabled className="w-full" size="lg">
                Face Not Detected - Position Yourself in Camera
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => router.push('/interviews')}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Interview view
  if (step === 'interview') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification) => (
            <InterviewNotification key={notification.id} {...notification} />
          ))}
        </div>

        <div className="max-w-7xl w-full mx-auto">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4 text-white">
            <div className="flex items-center justify-between text-sm">
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
                <span className={isFullscreen ? 'text-green-400' : 'text-red-400'}>
                  🖥️ {isFullscreen ? 'FULLSCREEN' : 'NOT FULLSCREEN'}
                </span>
              </div>
            </div>
          </div>

          {/* Fullscreen Warning */}
          {!isFullscreen && (
            <div className="bg-red-600 border border-red-400 rounded-lg p-4 mb-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-300" />
                  <div>
                    <p className="font-semibold">⚠️ FULLSCREEN REQUIRED</p>
                    <p className="text-sm text-red-100">You must return to fullscreen mode to continue the interview</p>
                  </div>
                </div>
                <Button
                  onClick={enterFullscreen}
                  className="bg-red-700 hover:bg-red-800 text-white border-red-500"
                  size="sm"
                >
                  <ArrowsPointingOutIcon className="w-4 h-4 mr-2" />
                  Enter Fullscreen
                </Button>
              </div>
            </div>
          )}



          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-400 mb-3">
                    Question {currentQuestionIndex + 1} of {interview.questions.length}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {interview.questions[currentQuestionIndex].question}
                  </h2>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Progress</span>
                    <span className="text-sm text-gray-400">
                      {currentQuestionIndex + 1} / {interview.questions.length}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {interview.questions.map((_: any, index: number) => (
                      <div
                        key={index}
                        className={`flex-1 h-2 rounded-full transition-all ${
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

                <Button 
                  onClick={handleNextQuestion} 
                  size="lg" 
                  className="w-full"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
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
              </div>
            </div>

            <div className="lg:col-span-1 space-y-4">
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700">
                <h3 className="text-white font-medium mb-3 text-center">Your Video</h3>
                <div className="relative">
                  <div className="relative aspect-square bg-black rounded-xl overflow-hidden border-2 border-[#0BC0DF]">
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
              </div>

              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700">
                <h3 className="text-white font-medium mb-3">Interview Status</h3>
                <div className="space-y-2 text-sm">
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
    );
  }

  // Complete view
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {notifications.map((notification) => (
          <InterviewNotification key={notification.id} {...notification} />
        ))}
      </div>

      <div className="text-center max-w-md mx-auto">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
          violationCount >= 2 
            ? 'bg-red-100 dark:bg-red-900' 
            : 'bg-green-100 dark:bg-green-900'
        }`}>
          {violationCount >= 2 ? (
            <XCircleIcon className="w-16 h-16 text-red-500" />
          ) : (
            <CheckCircleIcon className="w-16 h-16 text-green-500" />
          )}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {violationCount >= 2 ? 'Interview Cancelled!' : 'Interview Completed!'}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          {violationCount >= 2 
            ? 'Your interview was cancelled due to security violations.' 
            : 'Your interview has been submitted successfully.'
          }
        </p>
        
        {violationCount > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">
              ⚠️ Interview cancelled due to security violations: {violationCount}
            </p>
            <p className="text-red-700 dark:text-red-300 text-xs mt-1">
              Cheating attempts were detected during the interview process.
            </p>
          </div>
        )}
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          {violationCount >= 2 ? (
            <>
              <p className="text-red-800 dark:text-red-200 mb-2 font-medium">
                Your interview was automatically cancelled due to security violations.
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Multiple cheating attempts were detected. Please contact HR if you believe this was an error.
              </p>
            </>
          ) : (
            <>
              <p className="text-blue-800 dark:text-blue-200 mb-2">
                Your interview responses have been recorded and submitted.
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Our HR team will review your performance and contact you soon.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrictInterviewMode;