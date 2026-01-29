// API URL utility with robust fallback logic
export const getApiUrl = (): string => {
  // In browser environment
  if (typeof window !== 'undefined') {
    // Check if we're on the production domain
    if (window.location.hostname === 'cenopie.com' || window.location.hostname === 'www.cenopie.com') {
      return 'https://cenopie.com';
    }
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    }
  }
  
  // Server-side or fallback
  return process.env.NEXT_PUBLIC_API_URL || 'https://cenopie.com';
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