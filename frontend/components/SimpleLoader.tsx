'use client';

import Image from 'next/image';

interface SimpleLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  text?: string;
}

export default function SimpleLoader({ 
  size = 'md', 
  className = '', 
  showText = false,
  text = 'Loading...'
}: SimpleLoaderProps) {
  const sizeClasses = {
    sm: {
      container: 'py-4',
      logo: 'w-6 h-6',
      logoSize: { width: 24, height: 24 },
      spinner: 'w-6 h-6',
      text: 'text-xs',
      spacing: 'space-y-2'
    },
    md: {
      container: 'py-8',
      logo: 'w-8 h-8',
      logoSize: { width: 32, height: 32 },
      spinner: 'w-8 h-8',
      text: 'text-sm',
      spacing: 'space-y-2'
    },
    lg: {
      container: 'py-12',
      logo: 'w-10 h-10',
      logoSize: { width: 40, height: 40 },
      spinner: 'w-10 h-10',
      text: 'text-base',
      spacing: 'space-y-3'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex justify-center items-center ${currentSize.container} ${className}`}>
      <div className={`flex flex-col items-center ${currentSize.spacing}`}>
        {/* Simple Cenopie Logo */}
        <div className={`${currentSize.logo} flex items-center justify-center`}>
          <Image
            src="/logo.svg"
            alt="Cenopie"
            width={currentSize.logoSize.width}
            height={currentSize.logoSize.height}
            className="object-contain"
            priority
          />
        </div>

        {/* Simple Circular Spinner */}
        <div 
          className={`${currentSize.spinner} rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-[#0BC0DF] animate-spin`}
        ></div>

        {/* Optional Text */}
        {showText && (
          <p className={`text-gray-600 dark:text-gray-400 ${currentSize.text} font-medium`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

// Centered page version for full page loading
export function SimplePageLoader({ 
  size = 'lg', 
  className = '', 
  showText = false,
  text = 'Loading...'
}: SimpleLoaderProps) {
  return (
    <div className={`flex justify-center items-center min-h-screen ${className}`}>
      <SimpleLoader size={size} showText={showText} text={text} />
    </div>
  );
}

// Inline version for components
export function SimpleInlineLoader({ 
  size = 'sm', 
  className = '' 
}: Pick<SimpleLoaderProps, 'size' | 'className'>) {
  return (
    <div className={`flex justify-center items-center py-8 ${className}`}>
      <SimpleLoader size={size} />
    </div>
  );
}