"use client";
import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  eventId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error('ErrorBoundary - Error caught:', error);
    
    return { 
      hasError: true, 
      error,
      eventId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Enhanced error categorization
    const errorCategory = this.categorizeError(error);
    console.error('Error category:', errorCategory);
    
    // Log specific React 19 hook errors
    if (error.message.includes('call') || error.message.includes('hook')) {
      console.error('Possible React 19 hook compatibility issue detected');
    }
    
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
    
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private categorizeError(error: Error): string {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'chunk_load_error';
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'network_error';
    }
    if (error.message.includes('hook') || error.message.includes('call')) {
      return 'react_hook_error';
    }
    if (error.name === 'TypeError') {
      return 'type_error';
    }
    return 'unknown_error';
  }

  private reportError(error: Error, errorInfo: React.ErrorInfo) {
    // In a real app, you'd send this to your error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      eventId: this.state.eventId,
    };
    
    console.log('Error report (would be sent to tracking service):', errorReport);
  }

  private resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, eventId: undefined });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorCategory = this.categorizeError(this.state.error!);
      const isChunkError = errorCategory === 'chunk_load_error';
      const isNetworkError = errorCategory === 'network_error';

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isChunkError ? 'Update Available' : 
               isNetworkError ? 'Connection Problem' : 
               'Something went wrong'}
            </h2>
            
            <p className="text-gray-600 text-sm mb-6">
              {isChunkError ? 
                'A new version of the app is available. Please refresh to get the latest updates.' :
               isNetworkError ?
                'Please check your internet connection and try again.' :
                'An unexpected error occurred. Our team has been notified.'}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="text-red-700 text-xs cursor-pointer mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-red-50 p-3 rounded text-xs">
                  <div className="font-mono text-red-800 mb-2">
                    {this.state.error?.message}
                  </div>
                  <pre className="text-red-600 overflow-auto max-h-32 whitespace-pre-wrap">
                    {this.state.error?.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-red-600 mt-2 overflow-auto max-h-32 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              {!isChunkError && (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Try Again
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {isChunkError ? 'Refresh App' : 'Reload Page'}
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go to Home
              </button>
            </div>

            {this.state.eventId && (
              <p className="text-xs text-gray-400 mt-4">
                Error ID: {this.state.eventId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;