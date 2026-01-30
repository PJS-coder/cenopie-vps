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
      // Try different backend URLs for production
      return process.env.NEXT_PUBLIC_API_URL || 'https://cenopie.com:4000';
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

// Test API connectivity
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const apiUrl = getApiUrl();
    console.log('🔍 Testing API connection to:', apiUrl);
    
    // Test health endpoint first
    const healthResponse = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (healthResponse.ok) {
      console.log('✅ API health check passed');
      return true;
    } else {
      console.warn('⚠️ API health check failed:', healthResponse.status);
      return false;
    }
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    return false;
  }
};

// Log API URL for debugging (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔗 API URL configured:', getApiUrl());
  // Test connection in development
  testApiConnection();
}