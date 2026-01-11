'use client';

import { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

interface BackendStatusProps {
  className?: string;
}

export default function BackendStatus({ className = '' }: BackendStatusProps) {
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const checkStatus = async () => {
    setIsChecking(true);
    const available = await checkBackendHealth();
    setIsBackendAvailable(available);
    setLastChecked(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    checkStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isBackendAvailable === true) {
    return null; // Don't show anything when backend is working
  }

  if (isBackendAvailable === false) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Backend API Not Available
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              The backend API is not responding. Some features may not work properly. 
              You're seeing demo content until the API is deployed.
            </p>
            <div className="mt-3 flex items-center space-x-4">
              <button
                onClick={checkStatus}
                disabled={isChecking}
                className="inline-flex items-center text-sm text-yellow-800 hover:text-yellow-900 font-medium"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Checking...' : 'Check Again'}
              </button>
              {lastChecked && (
                <span className="text-xs text-yellow-600">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Still checking
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin mr-3" />
        <div>
          <h3 className="text-sm font-medium text-blue-800">
            Checking Backend Status...
          </h3>
          <p className="text-sm text-blue-700">
            Connecting to API server...
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for components to use backend status
export function useBackendStatus() {
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkBackendHealth = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${API_BASE_URL}/api/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error) {
        return false;
      }
    };

    const checkStatus = async () => {
      setIsChecking(true);
      const available = await checkBackendHealth();
      setIsBackendAvailable(available);
      setIsChecking(false);
    };

    checkStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { isBackendAvailable, isChecking };
}