// Diagnostic script to check upload route registration
// Run this with: node diagnose-upload-404.js

import express from 'express';
import uploadRoutes from './backend/src/routes/uploadRoutes.js';

const app = express();

console.log('🔍 Diagnosing upload routes...');

// Check if uploadRoutes is properly exported
console.log('uploadRoutes type:', typeof uploadRoutes);
console.log('uploadRoutes is Router:', uploadRoutes instanceof express.Router);

// Try to register the routes
try {
  app.use('/api/upload', uploadRoutes);
  console.log('✅ Upload routes registered successfully');
  
  // List all registered routes
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.source.replace('\\/?', '').replace('(?=\\/|$)', '') + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  console.log('📋 Registered routes:');
  routes.forEach(route => {
    console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
  });
  
} catch (error) {
  console.error('❌ Error registering upload routes:', error.message);
  console.error('Stack:', error.stack);
}

// Test the routes directly
const testRoutes = [
  '/api/upload/test',
  '/api/upload/interview-video'
];

console.log('\n🧪 Testing routes...');
const server = app.listen(3001, () => {
  console.log('Test server running on port 3001');
  
  testRoutes.forEach(async (route) => {
    try {
      const response = await fetch(`http://localhost:3001${route}`, {
        method: route.includes('interview-video') ? 'POST' : 'GET'
      });
      console.log(`${route}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${route}: ERROR - ${error.message}`);
    }
  });
  
  setTimeout(() => {
    server.close();
    process.exit(0);
  }, 2000);
});