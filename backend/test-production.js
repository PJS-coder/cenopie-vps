#!/usr/bin/env node

// Test script to verify production backend functionality
import fetch from 'node-fetch';

const API_BASE = 'https://api.cenopie.com';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n🧪 Testing ${description}...`);
    console.log(`📍 URL: ${API_BASE}${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${description} - SUCCESS`);
      console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ ${description} - FAILED`);
      const errorText = await response.text();
      console.log(`📄 Error:`, errorText);
    }
  } catch (error) {
    console.log(`❌ ${description} - ERROR`);
    console.log(`📄 Error:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Production Backend Tests...');
  console.log(`🌐 Testing API at: ${API_BASE}`);
  
  // Test basic health check
  await testEndpoint('/api/health', 'Basic Health Check');
  
  // Test detailed health check
  await testEndpoint('/api/health/detailed', 'Detailed Health Check');
  
  // Test CORS preflight
  try {
    console.log('\n🧪 Testing CORS preflight...');
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://cenopie-cpanel-vercel.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      }
    });
    
    console.log(`📊 CORS Status: ${response.status}`);
    console.log(`📊 CORS Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200 || response.status === 204) {
      console.log('✅ CORS - SUCCESS');
    } else {
      console.log('❌ CORS - FAILED');
    }
  } catch (error) {
    console.log('❌ CORS - ERROR:', error.message);
  }
  
  console.log('\n🏁 Production Backend Tests Complete!');
}

runTests().catch(console.error);