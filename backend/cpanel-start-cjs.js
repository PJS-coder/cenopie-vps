// CommonJS version for better cPanel compatibility
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Ensure required environment variables are set
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is required');
  process.exit(1);
}

console.log('🚀 Starting Cenopie Backend (CommonJS)...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 4000);

// Start the server using dynamic import
(async () => {
  try {
    await import('./src/server.js');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();