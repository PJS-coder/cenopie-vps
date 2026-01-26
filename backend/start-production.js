#!/usr/bin/env node

// Production startup script with minimal logging
import dotenv from 'dotenv';

// Load production environment
dotenv.config({ path: '.env.production' });

// Ensure production mode
process.env.NODE_ENV = 'production';

// Start the server
import('./src/server.js').catch(error => {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
});