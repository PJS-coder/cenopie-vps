// Simplified cPanel startup script
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure required environment variables are set
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is required');
  process.exit(1);
}

console.log('🚀 Starting Cenopie Backend...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 4000);

// Start the server
import('./src/server.js');