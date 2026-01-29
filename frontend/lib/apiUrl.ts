// API URL utility with robust fallback logic
export const getApiUrl = (): string => {
  // Force local development URL for now
  if (typeof window !== 'undefined') {
    console.log('🔗 API URL Debug:', {
      hostname: window.location.hostname,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV
    });
    
    // Always use localhost:4000 for local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
    
    // Check if we're on the production domain
    if (window.location.hostname === 'cenopie.com' || window.location.hostname === 'www.cenopie.com') {
      return 'https://cenopie.com';
    }
  }
  
  // Server-side or fallback - use localhost for development
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

// Helper function to build full API endpoint URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Log API URL for debugging (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔗 API URL configured:', getApiUrl());
}