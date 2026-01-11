'use client';

import React from 'react';

const LoadingPage = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#0BC0DF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingPage;