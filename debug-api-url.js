// Debug script to check API URL configuration
// Run with: node debug-api-url.js

console.log('🔍 Debugging API URL Configuration\n');

// Check environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

// Simulate browser environment
const mockWindow = {
  location: {
    hostname: 'cenopie.com'
  }
};

// Test the API URL logic
const getApiUrl = (window) => {
  if (window) {
    if (window.location.hostname === 'cenopie.com' || window.location.hostname === 'www.cenopie.com') {
      return 'https://cenopie.com';
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://cenopie.com';
};

console.log('\nAPI URL Resolution:');
console.log('Production (cenopie.com):', getApiUrl(mockWindow));
console.log('Localhost:', getApiUrl({ location: { hostname: 'localhost' } }));
console.log('Server-side/fallback:', getApiUrl(null));

// Test specific endpoints
const apiUrl = getApiUrl(mockWindow);
console.log('\nTest Endpoints:');
console.log('Upload endpoint:', `${apiUrl}/api/upload/interview-video`);
console.log('Interview completion:', `${apiUrl}/api/interviews/123/complete`);
console.log('Health check:', `${apiUrl}/api/health`);

console.log('\n✅ Debug complete');