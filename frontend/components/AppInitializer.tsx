'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface AppInitializerProps {
  children: React.ReactNode;
}

export default function AppInitializer({ children }: AppInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if app has been initialized before
    const hasInitialized = sessionStorage.getItem('app-initialized');
    
    if (hasInitialized) {
      setIsInitialized(true);
      return;
    }

    // Simulate initialization process
    const initSteps = [
      { name: 'Loading configuration', duration: 200 },
      { name: 'Connecting to services', duration: 300 },
      { name: 'Preparing interface', duration: 400 },
      { name: 'Ready', duration: 100 },
    ];

    let currentProgress = 0;
    let stepIndex = 0;

    const runInitialization = () => {
      if (stepIndex >= initSteps.length) {
        setProgress(100);
        setTimeout(() => {
          setIsInitialized(true);
          sessionStorage.setItem('app-initialized', 'true');
        }, 200);
        return;
      }

      const step = initSteps[stepIndex];
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
          setTimeout(runInitialization, 50);
        }
      };

      requestAnimationFrame(animateProgress);
    };

    // Start initialization after a brief delay
    setTimeout(runInitialization, 100);
  }, []);

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center space-y-8 max-w-sm w-full px-6">
          {/* Logo */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Cenopie"
              width={80}
              height={80}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>

          {/* Progress bar */}
          <div className="w-full">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#0BC0DF] to-cyan-400 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
              Welcome to Cenopie
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
