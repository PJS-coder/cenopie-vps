'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CenopieLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex flex-col items-center space-y-8">
        {/* Cenopie Logo with animated circle */}
        <div className="relative">
          {/* Outer glow effect */}
          <div className="absolute inset-0 -m-8 bg-[#0BC0DF] opacity-20 blur-3xl rounded-full animate-pulse"></div>
          
          {/* Animated circle around logo */}
          <div className="absolute inset-0 -m-6">
            <svg className="w-36 h-36 animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#E6F7FC"
                strokeWidth="2"
                className="opacity-30"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#0BC0DF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="70 213"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
          </div>
          
          {/* Logo */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Cenopie"
              width={80}
              height={80}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 bg-[#0BC0DF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 bg-[#0BC0DF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 bg-[#0BC0DF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
