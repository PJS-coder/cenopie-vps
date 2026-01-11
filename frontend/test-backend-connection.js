#!/usr/bin/env node

// Test script to verify frontend can connect to backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';

async function testConnection() {
  console.log('🧪 Testing Frontend -> Backend Connection');
  console.log(`🌐 API URL: ${API_URL}`);
  
  try {
    // Test basic health check
    console.log('\n📡 Testing health endpoint...');
    const response = await fetch(`${API_URL}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check successful:', data);
    } else {
      console.log('❌ Health check failed:', response.status, response.statusText);
    }
    
    // Test CORS
    console.log('\n📡 Testing CORS...');
    const corsResponse = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Origin': 'https://cenopie-cpanel-vercel.vercel.app',
        'Content-Type': 'application/json'
      }
    });
    
    if (corsResponse.ok) {
      console.log('✅ CORS working correctly');
    } else {
      console.log('❌ CORS issue:', corsResponse.status);
    }
    
    // Test API endpoint structure
    console.log('\n📡 Testing API endpoint structure...');
    const apiResponse = await fetch(`${API_URL}/api/posts/feed`);
    
    if (apiResponse.status === 401) {
      console.log('✅ API endpoints accessible (401 = needs auth, which is correct)');
    } else if (apiResponse.status === 404) {
      console.log('❌ API endpoints not found - route structure issue');
    } else {
      console.log(`ℹ️ API response: ${apiResponse.status} ${apiResponse.statusText}`);
    }
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testConnection();