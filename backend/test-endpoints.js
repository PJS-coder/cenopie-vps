#!/usr/bin/env node

/**
 * Quick test script to verify backend endpoints are accessible
 * Run with: node test-endpoints.js
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_URL || 'http://localhost:4000';

async function testEndpoint(path, method = 'GET') {
  try {
    console.log(`Testing ${method} ${API_BASE}${path}`);
    const response = await fetch(`${API_BASE}${path}`, { method });
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 404) {
      console.log('  ❌ Endpoint not found');
    } else if (response.status < 500) {
      console.log('  ✅ Endpoint exists');
    } else {
      console.log('  ⚠️  Server error');
    }
    
    return response.status;
  } catch (error) {
    console.log(`  ❌ Network error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🔍 Testing Backend Endpoints...\n');
  
  // Test basic health
  await testEndpoint('/health');
  await testEndpoint('/api/health');
  
  // Test upload endpoints
  await testEndpoint('/api/upload/interview-video', 'POST');
  await testEndpoint('/api/upload/profile-image', 'POST');
  
  // Test other API endpoints
  await testEndpoint('/api/auth/login', 'POST');
  await testEndpoint('/api/interviews');
  
  console.log('\n✅ Test completed');
}

runTests().catch(console.error);