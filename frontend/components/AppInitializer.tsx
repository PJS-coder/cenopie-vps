'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface AppInitializerProps {
  children: React.ReactNode;
}

export default function AppInitializer({ children }: AppInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    // Check if app has been initialized before or if user is authenticated
    const hasInitialized = sessionStorage.getItem('app-initialized');
    const isAuthenticated = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    
    // Skip initialization for authenticated users on subsequent visits
    if (hasInitialized || isAuthenticated) {
      setIsInitialized(true);
      return;
    }

    // Simulate initialization process for new users
    const initSteps = [
      { name: 'Loading configuration', duration: 300 },
      { name: 'Connecting to services', duration: 400 },
      { name: 'Preparing interface', duration: 500 },
      { name: 'Ready to go', duration: 200 },
    ];

    let currentProgress = 0;
    let stepIndex = 0;

    const runInitialization = () => {
      if (stepIndex >= initSteps.length) {
        setProgress(100);
        setCurrentStep('Welcome!');
        setTimeout(() => {
          setIsInitialized(true);
          sessionStorage.setItem('app-initialized', 'true');
        }, 300);
        return;
      }

      const step = initSteps[stepIndex];
      setCurrentStep(step.name);
      const stepProgress = (stepIndex + 1) / initSteps.length * 100;
      
      // Animate progress
      const startProgress = currentProgress;
      const progressDiff = stepProgress - startProgress;
      const startTime = Date.now();

      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / step.duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setProgress(startProgress + progressDiff * easeOut);

        if (progress < 1) {
          requestAnimationFrame(animateProgress);
        } else {
          currentProgress = stepProgress;
          stepIndex++;
          setTimeout(runInitialization, 100);
        }
      };

      requestAnimationFrame(animateProgress);
    };

    // Start initialization after a brief delay
    setTimeout(runInitialization, 200);
  }, []);

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center space-y-8 max-w-sm w-full px-6">
          {/* Logo with branding */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-16 h-16 flex items-center justify-center animate-pulse">
              <Image
                src="/logo-icon-only.svg"
                alt="Cenopie"
                width={64}
                height={64}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
            
            {/* Brand name with beta badge */}
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                <span className="text-gray-800 dark:text-white">ceno</span>
                <span className="text-[#0BC0DF]">pie</span>
              </h1>
              <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                BETA
              </span>
            </div>
          </div>

          {/* Progress section */}
          <div className="w-full space-y-3">
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#0BC0DF] via-cyan-400 to-blue-400 transition-all duration-500 ease-out rounded-full shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Status text */}
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentStep}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Professional Network & Career Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
