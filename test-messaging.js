#!/usr/bin/env node

// Simple test script to check messaging functionality
import io from 'socket.io-client';

const API_URL = 'http://localhost:4000';

console.log('🧪 Testing Socket.IO connection...');

const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  console.log('Socket ID:', socket.id);
  
  // Test ping
  socket.emit('ping');
});

socket.on('pong', (data) => {
  console.log('🏓 Pong received:', data);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Test for 10 seconds then exit
setTimeout(() => {
  console.log('🏁 Test complete');
  socket.disconnect();
  process.exit(0);
}, 10000);